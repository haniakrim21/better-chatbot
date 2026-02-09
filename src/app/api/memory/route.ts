import { getSession } from "auth/server";
import { memoryRepository } from "lib/db/repository";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const memories = await memoryRepository.selectByUserId(session.user.id);
    return NextResponse.json(memories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch memories" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await memoryRepository.deleteAll(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete memories" },
      { status: 500 },
    );
  }
}
