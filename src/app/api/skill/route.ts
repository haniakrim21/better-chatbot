import { getSession } from "auth/server";
import { skillRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skills = await skillRepository.selectByUserId(session.user.id);
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, instructions, tools, visibility } = body;

  if (!name || !instructions) {
    return NextResponse.json(
      { error: "name and instructions are required" },
      { status: 400 },
    );
  }

  const skill = await skillRepository.insert({
    name,
    description: description ?? null,
    instructions,
    tools: tools ?? null,
    userId: session.user.id,
    visibility: visibility ?? "private",
  });

  return NextResponse.json(skill, { status: 201 });
}
