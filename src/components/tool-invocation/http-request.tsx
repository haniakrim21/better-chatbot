"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { cn, toAny } from "lib/utils";
import {
  AlertTriangleIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Globe,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Badge } from "ui/badge";
import JsonView from "ui/json-view";
import { TextShimmer } from "ui/text-shimmer";

interface HttpRequestToolInvocationProps {
  part: ToolUIPart;
}

function getMethodColor(method: string) {
  switch (method?.toUpperCase()) {
    case "GET":
      return "text-green-500";
    case "POST":
      return "text-blue-500";
    case "PUT":
      return "text-yellow-500";
    case "PATCH":
      return "text-orange-500";
    case "DELETE":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return "text-green-500";
  if (status >= 300 && status < 400) return "text-yellow-500";
  if (status >= 400 && status < 500) return "text-orange-500";
  if (status >= 500) return "text-red-500";
  return "text-muted-foreground";
}

function PureHttpRequestToolInvocation({
  part,
}: HttpRequestToolInvocationProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  const input = part.input as {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  };

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as {
      isError?: boolean;
      error?: string;
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
      body?: any;
      ok?: boolean;
      url?: string;
    };
  }, [part.state, part.output]);

  const method = input?.method || "GET";
  const url = input?.url || "";

  // Truncate URL for display
  const displayUrl = useMemo(() => {
    try {
      const parsed = new URL(url);
      const path =
        parsed.pathname.length > 40
          ? parsed.pathname.slice(0, 40) + "..."
          : parsed.pathname;
      return `${parsed.host}${path}${parsed.search ? "?" + "..." : ""}`;
    } catch {
      return url.length > 60 ? url.slice(0, 60) + "..." : url;
    }
  }, [url]);

  if (!part.state.startsWith("output")) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Globe className="size-4 wiggle text-muted-foreground" />
        <TextShimmer>{`${method} ${displayUrl}`}</TextShimmer>
      </div>
    );
  }

  if (result?.isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-destructive" />
          <span className={cn("font-mono text-xs", getMethodColor(method))}>
            {method}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-md">
            {displayUrl}
          </span>
        </div>
        <div className="ms-6 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2">
        <Globe className="size-4 text-muted-foreground" />
        <span
          className={cn("font-mono text-xs font-bold", getMethodColor(method))}
        >
          {method}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-md">
          {displayUrl}
        </span>
        {result?.status && (
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 font-mono",
              getStatusColor(result.status),
            )}
          >
            {result.ok ? (
              <CheckCircle2 className="size-2.5 me-1" />
            ) : (
              <AlertTriangleIcon className="size-2.5 me-1" />
            )}
            {result.status} {result.statusText}
          </Badge>
        )}
      </div>

      {/* Response Body */}
      {result?.body != null && (
        <div className="ms-6 mt-1">
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowResponse(!showResponse)}
          >
            {showResponse ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Response Body
          </button>
          {showResponse && (
            <div className="mt-1 p-3 rounded-md bg-card border text-xs max-h-[300px] overflow-auto">
              {typeof result.body === "string" ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
                  {result.body}
                </pre>
              ) : (
                <JsonView data={result.body} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Response Headers */}
      {result?.headers && Object.keys(result.headers).length > 0 && (
        <div className="ms-6">
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            {showHeaders ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Headers ({Object.keys(result.headers).length})
          </button>
          {showHeaders && (
            <div className="mt-1 p-3 rounded-md bg-card border text-xs max-h-[200px] overflow-auto">
              <div className="flex flex-col gap-1">
                {Object.entries(result.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-mono text-muted-foreground shrink-0">
                      {key}:
                    </span>
                    <span className="font-mono break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function areEqual(
  { part: prevPart }: HttpRequestToolInvocationProps,
  { part: nextPart }: HttpRequestToolInvocationProps,
) {
  if (prevPart.state != nextPart.state) return false;
  if (!equal(prevPart.input, nextPart.input)) return false;
  if (
    prevPart.state.startsWith("output") &&
    !equal(prevPart.output, toAny(nextPart).output)
  )
    return false;
  return true;
}

export const HttpRequestToolInvocation = memo(
  PureHttpRequestToolInvocation,
  areEqual,
);
