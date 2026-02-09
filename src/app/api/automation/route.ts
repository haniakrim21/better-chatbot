import { getSession } from "auth/server";
import { automationRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const automations = await automationRepository.selectByUserId(
    session.user.id,
  );
  return NextResponse.json(automations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, schedule, prompt, agentId, enabled } = body;

  if (!name || !schedule || !prompt) {
    return NextResponse.json(
      { error: "name, schedule, and prompt are required" },
      { status: 400 },
    );
  }

  const automation = await automationRepository.insert({
    name,
    description: description ?? null,
    schedule,
    prompt,
    agentId: agentId ?? null,
    enabled: enabled ?? true,
    userId: session.user.id,
  });

  return NextResponse.json(automation, { status: 201 });
}
