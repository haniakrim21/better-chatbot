import { getSession } from "auth/server";
import { memoryRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

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
    await memoryRepository.delete(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete memory" },
      { status: 500 },
    );
  }
}

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
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }
    const memory = await memoryRepository.update(id, session.user.id, content);
    return NextResponse.json(memory);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update memory" },
      { status: 500 },
    );
  }
}
