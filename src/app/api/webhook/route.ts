import { getSession } from "auth/server";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { pgDb } from "lib/db/pg/db.pg";
import { WebhookTriggerTable } from "lib/db/pg/schema.pg";
import { generateUUID } from "lib/utils";

// GET: List webhooks for the authenticated user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const webhooks = await pgDb
    .select()
    .from(WebhookTriggerTable)
    .where(eq(WebhookTriggerTable.userId, session.user.id));

  return Response.json(webhooks);
}

// POST: Create a new webhook trigger
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { workflowId, name, description } = await request.json();

  if (!workflowId || !name) {
    return Response.json(
      { error: "workflowId and name are required" },
      { status: 400 },
    );
  }

  // Generate a random secret for HMAC verification
  const secret = crypto.randomBytes(32).toString("hex");

  const [webhook] = await pgDb
    .insert(WebhookTriggerTable)
    .values({
      id: generateUUID(),
      workflowId,
      userId: session.user.id,
      name,
      description,
      secret,
      isActive: true,
      triggerCount: 0,
    })
    .returning();

  return Response.json(webhook, { status: 201 });
}

// DELETE: Delete a webhook
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await pgDb
    .delete(WebhookTriggerTable)
    .where(
      and(
        eq(WebhookTriggerTable.id, id),
        eq(WebhookTriggerTable.userId, session.user.id),
      ),
    );

  return Response.json({ success: true });
}

// PATCH: Update webhook (toggle active, rename, etc.)
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, name, description, isActive } = await request.json();

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const [updated] = await pgDb
    .update(WebhookTriggerTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(WebhookTriggerTable.id, id),
        eq(WebhookTriggerTable.userId, session.user.id),
      ),
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Webhook not found" }, { status: 404 });
  }

  return Response.json(updated);
}
