"use client";

import {
  BarChart3,
  Brain,
  DollarSign,
  Download,
  Hash,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d" | "all";

type AnalyticsData = {
  summary: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  };
  modelBreakdown: {
    modelId: string;
    provider: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  }[];
  dailyUsage: {
    date: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  }[];
  providerBreakdown: {
    provider: string;
    totalTokens: number;
    requestCount: number;
  }[];
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-500",
  anthropic: "bg-orange-500",
  google: "bg-blue-500",
  xai: "bg-slate-500",
  groq: "bg-purple-500",
  openRouter: "bg-pink-500",
  thesys: "bg-cyan-500",
};

// Rough cost estimates per 1M tokens (input/output averaged)
const COST_PER_MILLION: Record<string, number> = {
  "gpt-4o": 5.0,
  "gpt-4o-mini": 0.3,
  "gpt-4-turbo": 20.0,
  "gpt-3.5-turbo": 1.0,
  "claude-3-5-sonnet": 6.0,
  "claude-3-opus": 30.0,
  "claude-3-haiku": 0.5,
  "gemini-pro": 1.0,
  "gemini-1.5-pro": 3.5,
  "gemini-1.5-flash": 0.2,
};

function estimateCost(modelBreakdown: AnalyticsData["modelBreakdown"]): number {
  return modelBreakdown.reduce((total, model) => {
    const modelKey = Object.keys(COST_PER_MILLION).find((key) =>
      model.modelId.toLowerCase().includes(key.toLowerCase()),
    );
    const costRate = modelKey ? COST_PER_MILLION[modelKey] : 2.0; // default $2/M
    return total + (model.totalTokens / 1_000_000) * costRate;
  }, 0);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(n: number): string {
  if (n < 0.01) return "<$0.01";
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(2)}`;
}

function TokenBar({
  max,
  value,
  className,
}: {
  max: number;
  value: number;
  className?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 rounded-full bg-muted w-full">
      <div
        className={cn("h-2 rounded-full transition-all", className)}
        style={{ width: `${Math.max(pct, 1)}%` }}
      />
    </div>
  );
}

function exportToCSV(data: AnalyticsData) {
  const rows = [
    ["Date", "Total Tokens", "Input Tokens", "Output Tokens", "Requests"],
    ...data.dailyUsage.map((d) => [
      d.date,
      d.totalTokens.toString(),
      d.inputTokens.toString(),
      d.outputTokens.toString(),
      d.requestCount.toString(),
    ]),
    [],
    ["Model", "Provider", "Total Tokens", "Requests"],
    ...data.modelBreakdown.map((m) => [
      m.modelId,
      m.provider,
      m.totalTokens.toString(),
      m.requestCount.toString(),
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Analytics exported to CSV");
}

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevData, setPrevData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch current period
    const currentFetch = fetch(`/api/analytics?period=${period}`).then((r) =>
      r.json(),
    );

    // Fetch previous period for comparison
    const prevPeriodMap: Record<Period, string> = {
      "7d": "14d",
      "30d": "60d",
      "90d": "180d",
      all: "all",
    };
    const prevFetch =
      period !== "all"
        ? fetch(`/api/analytics?period=${prevPeriodMap[period]}`).then((r) =>
            r.json(),
          )
        : Promise.resolve(null);

    Promise.all([currentFetch, prevFetch])
      .then(([current, prev]) => {
        setData(current);
        setPrevData(prev);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const maxDailyTokens = data
    ? Math.max(...data.dailyUsage.map((d) => d.totalTokens), 1)
    : 1;

  const maxModelTokens = data
    ? Math.max(...data.modelBreakdown.map((m) => m.totalTokens), 1)
    : 1;

  // Compute trend percentages
  const computeTrend = (current: number, previous: number) => {
    if (previous === 0) return null;
    // The previous period data includes the current period, so subtract
    const prevOnly = previous - current;
    if (prevOnly <= 0) return null;
    const pct = ((current - prevOnly) / prevOnly) * 100;
    return pct;
  };

  const tokenTrend =
    data && prevData
      ? computeTrend(data.summary.totalTokens, prevData.summary.totalTokens)
      : null;

  const requestTrend =
    data && prevData
      ? computeTrend(data.summary.requestCount, prevData.summary.requestCount)
      : null;

  const estimatedCost = data ? estimateCost(data.modelBreakdown) : 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(data)}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export CSV
            </Button>
          )}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          {t("noData")}
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalTokens")}
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTokens(data.summary.totalTokens)}
                </div>
                {tokenTrend !== null && (
                  <p
                    className={cn(
                      "text-xs flex items-center gap-1 mt-1",
                      tokenTrend > 0 ? "text-orange-500" : "text-green-500",
                    )}
                  >
                    {tokenTrend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(tokenTrend).toFixed(0)}% vs prev
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("inputTokens")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTokens(data.summary.inputTokens)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalTokens > 0
                    ? (
                        (data.summary.inputTokens / data.summary.totalTokens) *
                        100
                      ).toFixed(0)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("outputTokens")}
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTokens(data.summary.outputTokens)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalTokens > 0
                    ? (
                        (data.summary.outputTokens / data.summary.totalTokens) *
                        100
                      ).toFixed(0)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("requests")}
                </CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.requestCount.toLocaleString()}
                </div>
                {requestTrend !== null && (
                  <p
                    className={cn(
                      "text-xs flex items-center gap-1 mt-1",
                      requestTrend > 0 ? "text-orange-500" : "text-green-500",
                    )}
                  >
                    {requestTrend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(requestTrend).toFixed(0)}% vs prev
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCost(estimatedCost)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~
                  {formatCost(estimatedCost / (data.summary.requestCount || 1))}
                  /request
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("dailyUsage")}
              </CardTitle>
              <CardDescription>{t("dailyUsageDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.dailyUsage.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("noData")}
                </p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {data.dailyUsage.map((day) => {
                    const pct =
                      maxDailyTokens > 0
                        ? (day.totalTokens / maxDailyTokens) * 100
                        : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 group relative"
                        title={`${day.date}: ${formatTokens(day.totalTokens)} tokens, ${day.requestCount} requests`}
                      >
                        <div
                          className="bg-primary/80 hover:bg-primary rounded-t transition-all w-full"
                          style={{
                            height: `${Math.max(pct, 2)}%`,
                          }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {formatTokens(day.totalTokens)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {data.dailyUsage.length > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{data.dailyUsage[0]?.date}</span>
                  <span>
                    {data.dailyUsage[data.dailyUsage.length - 1]?.date}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Model Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t("modelBreakdown")}</CardTitle>
                <CardDescription>
                  {t("modelBreakdownDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.modelBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t("noData")}
                  </p>
                ) : (
                  data.modelBreakdown.slice(0, 10).map((model) => (
                    <div key={`${model.provider}-${model.modelId}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[60%]">
                          {model.modelId}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTokens(model.totalTokens)} tokens
                        </span>
                      </div>
                      <TokenBar
                        max={maxModelTokens}
                        value={model.totalTokens}
                        className={
                          PROVIDER_COLORS[model.provider] || "bg-primary"
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                        <span>{model.provider}</span>
                        <span>
                          {model.requestCount}{" "}
                          {model.requestCount === 1 ? "request" : "requests"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Provider Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t("providerBreakdown")}</CardTitle>
                <CardDescription>
                  {t("providerBreakdownDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.providerBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t("noData")}
                  </p>
                ) : (
                  data.providerBreakdown.map((provider) => {
                    const maxProviderTokens = Math.max(
                      ...data.providerBreakdown.map((p) => p.totalTokens),
                      1,
                    );
                    return (
                      <div key={provider.provider}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium capitalize">
                            {provider.provider}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTokens(provider.totalTokens)} tokens
                          </span>
                        </div>
                        <TokenBar
                          max={maxProviderTokens}
                          value={provider.totalTokens}
                          className={
                            PROVIDER_COLORS[provider.provider] || "bg-primary"
                          }
                        />
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {provider.requestCount} requests
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
