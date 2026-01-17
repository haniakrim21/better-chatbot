"use server";

import { validatedActionWithUser } from "lib/action-utils";
import { z } from "zod";
import { UsageTrackingTable } from "lib/db/pg/schema.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { eq, sql } from "drizzle-orm";

export const getUsageStats = validatedActionWithUser(
  z.object({}),
  async (_, __, userSession) => {
    try {
      const stats = await pgDb
        .select({
          modelId: UsageTrackingTable.modelId,
          provider: UsageTrackingTable.provider,
          inputTokens: sql<number>`sum(${UsageTrackingTable.inputTokens})`,
          outputTokens: sql<number>`sum(${UsageTrackingTable.outputTokens})`,
          totalTokens: sql<number>`sum(${UsageTrackingTable.totalTokens})`,
        })
        .from(UsageTrackingTable)
        .where(eq(UsageTrackingTable.userId, userSession.id))
        .groupBy(UsageTrackingTable.modelId, UsageTrackingTable.provider);

      const totalUsage = stats.reduce(
        (acc, curr) => acc + (Number(curr.totalTokens) || 0),
        0,
      );

      return {
        success: true,
        data: {
          period: "All Time",
          totalTokens: totalUsage,
          messageCount: 0, // We can't easily track this without joining chat messages or adding a count column
          threadCount: 0, // Same here
          modelStats: stats.map((s) => ({
            model: s.modelId,
            messageCount: 0,
            totalTokens: Number(s.totalTokens) || 0,
            provider: s.provider,
          })),
        },
      };
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
      return { success: false, error: "Failed to fetch usage stats" };
    }
  },
);
