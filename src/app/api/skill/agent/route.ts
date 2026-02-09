import { getSession } from "auth/server";
import { skillRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

// GET /api/skill/agent?agentId=xxx — get skills attached to an agent
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  const skills = await skillRepository.selectSkillsByAgentId(agentId);
  return NextResponse.json(skills);
}

// POST /api/skill/agent — attach a skill to an agent
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, skillId } = await req.json();
  if (!agentId || !skillId) {
    return NextResponse.json(
      { error: "agentId and skillId are required" },
      { status: 400 },
    );
  }

  const result = await skillRepository.attachSkill(agentId, skillId);
  return NextResponse.json(result, { status: 201 });
}

// DELETE /api/skill/agent — detach a skill from an agent
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, skillId } = await req.json();
  if (!agentId || !skillId) {
    return NextResponse.json(
      { error: "agentId and skillId are required" },
      { status: 400 },
    );
  }

  await skillRepository.detachSkill(agentId, skillId);
  return NextResponse.json({ ok: true });
}
