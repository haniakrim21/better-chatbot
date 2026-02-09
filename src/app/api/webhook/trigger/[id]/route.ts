import { colorize } from "consola/utils";
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { createWorkflowExecutor } from "lib/ai/workflow/executor/workflow-executor";
import { encodeWorkflowEvent } from "lib/ai/workflow/shared.workflow";
import { pgDb } from "lib/db/pg/db.pg";
import { WebhookTriggerTable } from "lib/db/pg/schema.pg";
import { workflowRepository } from "lib/db/repository";
import { safeJSONParse, toAny } from "lib/utils";
import logger from "logger";

/**
 * Webhook trigger endpoint.
 * External systems POST to /api/webhook/trigger/[webhookId] with a JSON body.
 * The body is passed as the workflow query input.
 *
 * Optional HMAC verification: Include X-Webhook-Signature header
 * with HMAC-SHA256 of the raw body using the webhook secret.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: webhookId } = await params;

  // Look up the webhook
  const [webhook] = await pgDb
    .select()
    .from(WebhookTriggerTable)
    .where(eq(WebhookTriggerTable.id, webhookId));

  if (!webhook) {
    return Response.json({ error: "Webhook not found" }, { status: 404 });
  }

  if (!webhook.isActive) {
    return Response.json({ error: "Webhook is disabled" }, { status: 403 });
  }

  // Parse request body
  const rawBody = await request.text();
  let body: Record<string, unknown> = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  // Verify HMAC signature if webhook has a secret configured
  if (webhook.secret) {
    const signature = request.headers.get("x-webhook-signature");
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhook.secret)
        .update(rawBody)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        )
      ) {
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
    // If no signature header is provided, we still allow it
    // (signature verification is optional but recommended)
  }

  // Load the workflow
  const workflow = await workflowRepository.selectStructureById(
    webhook.workflowId,
  );
  if (!workflow) {
    return Response.json(
      { error: "Associated workflow not found" },
      { status: 404 },
    );
  }

  // Update trigger count and last triggered timestamp
  await pgDb
    .update(WebhookTriggerTable)
    .set({
      triggerCount: sql`${WebhookTriggerTable.triggerCount} + 1`,
      lastTriggeredAt: new Date(),
    })
    .where(eq(WebhookTriggerTable.id, webhookId));

  const wfLogger = logger.withDefaults({
    message: colorize(
      "cyan",
      `WEBHOOK '${webhook.name}' -> '${workflow.name}' `,
    ),
  });

  const app = createWorkflowExecutor({
    edges: workflow.edges,
    nodes: workflow.nodes,
    userId: webhook.userId,
    logger: wfLogger,
  });

  const encoder = new TextEncoder();

  // Stream the workflow execution events back to the caller
  const stream = new ReadableStream({
    start(controller) {
      let isAborted = false;

      app.subscribe((evt) => {
        if (isAborted) return;
        if (
          (evt.eventType === "NODE_START" || evt.eventType === "NODE_END") &&
          evt.node.name === "SKIP"
        ) {
          return;
        }
        try {
          const err = toAny(evt)?.error;
          if (err) {
            toAny(evt).error = {
              name: err.name || "ERROR",
              message: err?.message || safeJSONParse(err).value,
            };
          }
          const data = encodeWorkflowEvent(evt);
          controller.enqueue(encoder.encode(data));
          if (evt.eventType === "WORKFLOW_END") {
            controller.close();
          }
        } catch (error) {
          logger.error("Webhook stream write error:", error);
          controller.error(error);
        }
      });

      request.signal.addEventListener("abort", async () => {
        isAborted = true;
        void app.exit();
        controller.close();
      });

      app
        .run(
          { query: body },
          {
            disableHistory: true,
            timeout: 1000 * 60 * 5,
          },
        )
        .then((result) => {
          if (!result.isOk) {
            logger.error("Webhook workflow execution error:", result.error);
          }
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Webhook-Signature",
    },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Webhook-Signature",
    },
  });
}
