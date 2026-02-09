import { generateText } from "ai";
import { getSession } from "auth/server";
import { customModelProvider } from "lib/ai/models";
import { agentRepository, automationRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const automation = await automationRepository.selectById(id, session.user.id);

  if (!automation) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 },
    );
  }

  try {
    // Load agent instructions if an agent is attached
    let systemPrompt = "You are a helpful assistant running an automated task.";
    if (automation.agentId) {
      const agent = await agentRepository.selectAgentById(
        automation.agentId,
        session.user.id,
      );
      if (agent?.instructions) {
        if (agent.instructions.role) {
          systemPrompt += `\n\nYour role: ${agent.instructions.role}`;
        }
        if (agent.instructions.systemPrompt) {
          systemPrompt += `\n\n${agent.instructions.systemPrompt}`;
        }
      }
    }

    const model = customModelProvider.getModel();
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: automation.prompt,
    });

    // Update last run info
    await automationRepository.update(id, session.user.id, {
      lastRunAt: new Date(),
      lastRunStatus: "success",
      lastRunResult: text.slice(0, 2000), // Truncate for storage
    });

    return NextResponse.json({
      success: true,
      result: text,
    });
  } catch (error: any) {
    await automationRepository.update(id, session.user.id, {
      lastRunAt: new Date(),
      lastRunStatus: "error",
      lastRunResult: error?.message?.slice(0, 2000) ?? "Unknown error",
    });

    return NextResponse.json(
      { error: "Automation run failed", details: error?.message },
      { status: 500 },
    );
  }
}
