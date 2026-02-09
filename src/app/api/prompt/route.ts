import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreatePromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const prompts = await promptRepository.selectByUserId(session.user.id);
    return NextResponse.json(prompts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch prompts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const data = CreatePromptSchema.parse(body);
    const prompt = await promptRepository.insert({
      ...data,
      userId: session.user.id,
    });
    return NextResponse.json(prompt, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create prompt" },
      { status: 500 },
    );
  }
}
