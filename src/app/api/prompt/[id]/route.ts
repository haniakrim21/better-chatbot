import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const data = UpdatePromptSchema.parse(body);
    const prompt = await promptRepository.update(id, session.user.id, data);
    return NextResponse.json(prompt);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update prompt" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await promptRepository.delete(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete prompt" },
      { status: 500 },
    );
  }
}
