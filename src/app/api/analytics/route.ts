import { getSession } from "auth/server";
import { usageAnalyticsRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";
    const days =
      period === "7d"
        ? 7
        : period === "90d"
          ? 90
          : period === "all"
            ? 3650
            : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceParam = period === "all" ? undefined : since;

    const [summary, modelBreakdown, dailyUsage, providerBreakdown] =
      await Promise.all([
        usageAnalyticsRepository.getSummary(session.user.id, sinceParam),
        usageAnalyticsRepository.getModelBreakdown(session.user.id, sinceParam),
        usageAnalyticsRepository.getDailyUsage(session.user.id, days),
        usageAnalyticsRepository.getProviderBreakdown(
          session.user.id,
          sinceParam,
        ),
      ]);

    return NextResponse.json({
      summary,
      modelBreakdown,
      dailyUsage,
      providerBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
