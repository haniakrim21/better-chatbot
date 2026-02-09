import { generateText } from "ai";
import { CronExpressionParser } from "cron-parser";
import { customModelProvider } from "lib/ai/models";
import { agentRepository, automationRepository } from "lib/db/repository";
import globalLogger from "logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const logger = globalLogger.withDefaults({ message: "Cron Automations: " });

/**
 * Determine if an automation should run now based on its cron schedule.
 *
 * Compares the cron's "previous occurrence" (relative to now) against the
 * automation's lastRunAt. If the previous occurrence is newer than lastRunAt
 * (or lastRunAt is null), the automation is due.
 */
function isDue(schedule: string, lastRunAt: Date | null): boolean {
  try {
    const expr = CronExpressionParser.parse(schedule);
    const prev = expr.prev().toDate();
    if (!lastRunAt) return true;
    return prev.getTime() > lastRunAt.getTime();
  } catch {
    return false;
  }
}

async function runAutomation(automation: {
  id: string;
  userId: string;
  prompt: string;
  agentId: string | null;
}): Promise<void> {
  const { id, userId, prompt, agentId } = automation;

  try {
    let systemPrompt = "You are a helpful assistant running an automated task.";
    if (agentId) {
      const agent = await agentRepository.selectAgentById(agentId, userId);
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
      prompt,
    });

    await automationRepository.update(id, userId, {
      lastRunAt: new Date(),
      lastRunStatus: "success",
      lastRunResult: text.slice(0, 2000),
    });

    logger.info(`Automation ${id} completed successfully`);
  } catch (error: any) {
    await automationRepository.update(id, userId, {
      lastRunAt: new Date(),
      lastRunStatus: "error",
      lastRunResult: error?.message?.slice(0, 2000) ?? "Unknown error",
    });
    logger.error(`Automation ${id} failed:`, error?.message);
  }
}

/**
 * GET /api/cron/automations
 *
 * Called by an external scheduler (Vercel Cron, Railway Cron, etc.)
 * every minute. Checks all enabled automations and runs those that
 * are due according to their cron schedule.
 *
 * Protect with CRON_SECRET env var in production.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const allEnabled = await automationRepository.selectEnabled();
  const due = allEnabled.filter((a) => isDue(a.schedule, a.lastRunAt));

  logger.info(
    `Found ${allEnabled.length} enabled automations, ${due.length} are due`,
  );

  // Run due automations in parallel (with a concurrency limit)
  const results: { id: string; status: string }[] = [];

  // Process in batches of 5 to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < due.length; i += batchSize) {
    const batch = due.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (automation) => {
        await runAutomation(automation);
        return { id: automation.id, status: "completed" };
      }),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({ id: "unknown", status: "failed" });
      }
    }
  }

  return NextResponse.json({
    processed: results.length,
    total: allEnabled.length,
    results,
  });
}
