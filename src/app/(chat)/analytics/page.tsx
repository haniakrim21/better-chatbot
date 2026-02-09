"use client";

import { BarChart3, Brain, Hash, Loader2, TrendingUp, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
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

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const maxDailyTokens = data
    ? Math.max(...data.dailyUsage.map((d) => d.totalTokens), 1)
    : 1;

  const maxModelTokens = data
    ? Math.max(...data.modelBreakdown.map((m) => m.totalTokens), 1)
    : 1;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
