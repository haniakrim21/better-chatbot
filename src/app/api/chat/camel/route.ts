import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { multiAgentOrchestrator } from "@/lib/services/multi-agent-orchestrator";
import { chatRepository } from "@/lib/db/repository";
import { generateUUID } from "@/lib/utils";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { task, roleA, roleB, turns, threadId: existingThreadId } = body;

    if (!task || !roleA || !roleB || !turns) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const threadId = existingThreadId || generateUUID();

    // Ensure thread exists if it's a new one
    if (!existingThreadId) {
      await chatRepository.insertThread({
        id: threadId,
        userId,
        title: `Multi-Agent Session: ${task.slice(0, 30)}...`,
      });
    }

    // Start the Multi-Agent session in the background
    // We don't await the full run here if we want to return the threadId immediately,
    // but for simplicity in V1 we might want to return after the first turn or just let it run.

    // For now, let's trigger it asynchronously and return the threadId
    // In a production app, we'd use a background queue or SSE/Websockets to stream progress.

    (async () => {
      try {
        await multiAgentOrchestrator.runSession({
          userId,
          threadId,
          taskDescription: task,
          userRole: { name: roleA.name, agentId: roleA.id },
          assistantRole: { name: roleB.name, agentId: roleB.id },
          maxTurns: turns,
        });
      } catch (err) {
        logger.error("Background Multi-Agent Session failed:", err);
      }
    })();

    return NextResponse.json({ threadId, status: "started" });
  } catch (error) {
    logger.error("Multi-Agent API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
