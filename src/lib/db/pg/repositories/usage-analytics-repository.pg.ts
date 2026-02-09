import { and, eq, gte, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { UsageTrackingTable } from "../schema.pg";

export type UsageSummary = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
};

export type ModelBreakdown = {
  modelId: string;
  provider: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
};

export type DailyUsage = {
  date: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
};

export type ProviderBreakdown = {
  provider: string;
  totalTokens: number;
  requestCount: number;
};

export const pgUsageAnalyticsRepository = {
  async getSummary(userId: string, since?: Date): Promise<UsageSummary> {
    const conditions = [eq(UsageTrackingTable.userId, userId)];
    if (since) {
      conditions.push(gte(UsageTrackingTable.createdAt, since));
    }

    const [result] = await db
      .select({
        totalTokens: sql<number>`coalesce(sum(${UsageTrackingTable.totalTokens}), 0)`,
        inputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.inputTokens}), 0)`,
        outputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.outputTokens}), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(UsageTrackingTable)
      .where(and(...conditions));

    return {
      totalTokens: Number(result.totalTokens),
      inputTokens: Number(result.inputTokens),
      outputTokens: Number(result.outputTokens),
      requestCount: Number(result.requestCount),
    };
  },

  async getModelBreakdown(
    userId: string,
    since?: Date,
  ): Promise<ModelBreakdown[]> {
    const conditions = [eq(UsageTrackingTable.userId, userId)];
    if (since) {
      conditions.push(gte(UsageTrackingTable.createdAt, since));
    }

    const results = await db
      .select({
        modelId: UsageTrackingTable.modelId,
        provider: UsageTrackingTable.provider,
        totalTokens: sql<number>`coalesce(sum(${UsageTrackingTable.totalTokens}), 0)`,
        inputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.inputTokens}), 0)`,
        outputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.outputTokens}), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(UsageTrackingTable)
      .where(and(...conditions))
      .groupBy(UsageTrackingTable.modelId, UsageTrackingTable.provider)
      .orderBy(sql`sum(${UsageTrackingTable.totalTokens}) desc`);

    return results.map((r) => ({
      modelId: r.modelId,
      provider: r.provider,
      totalTokens: Number(r.totalTokens),
      inputTokens: Number(r.inputTokens),
      outputTokens: Number(r.outputTokens),
      requestCount: Number(r.requestCount),
    }));
  },

  async getDailyUsage(
    userId: string,
    days: number = 30,
  ): Promise<DailyUsage[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await db
      .select({
        date: sql<string>`to_char(${UsageTrackingTable.createdAt}, 'YYYY-MM-DD')`,
        totalTokens: sql<number>`coalesce(sum(${UsageTrackingTable.totalTokens}), 0)`,
        inputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.inputTokens}), 0)`,
        outputTokens: sql<number>`coalesce(sum(${UsageTrackingTable.outputTokens}), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(UsageTrackingTable)
      .where(
        and(
          eq(UsageTrackingTable.userId, userId),
          gte(UsageTrackingTable.createdAt, since),
        ),
      )
      .groupBy(sql`to_char(${UsageTrackingTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${UsageTrackingTable.createdAt}, 'YYYY-MM-DD') asc`);

    return results.map((r) => ({
      date: r.date,
      totalTokens: Number(r.totalTokens),
      inputTokens: Number(r.inputTokens),
      outputTokens: Number(r.outputTokens),
      requestCount: Number(r.requestCount),
    }));
  },

  async getProviderBreakdown(
    userId: string,
    since?: Date,
  ): Promise<ProviderBreakdown[]> {
    const conditions = [eq(UsageTrackingTable.userId, userId)];
    if (since) {
      conditions.push(gte(UsageTrackingTable.createdAt, since));
    }

    const results = await db
      .select({
        provider: UsageTrackingTable.provider,
        totalTokens: sql<number>`coalesce(sum(${UsageTrackingTable.totalTokens}), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(UsageTrackingTable)
      .where(and(...conditions))
      .groupBy(UsageTrackingTable.provider)
      .orderBy(sql`sum(${UsageTrackingTable.totalTokens}) desc`);

    return results.map((r) => ({
      provider: r.provider,
      totalTokens: Number(r.totalTokens),
      requestCount: Number(r.requestCount),
    }));
  },
};
