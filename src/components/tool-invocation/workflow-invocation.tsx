import { useCopy } from "@/hooks/use-copy";
import { VercelAIWorkflowToolStreamingResult } from "app-types/workflow";
import equal from "lib/equal";
import { AlertTriangleIcon, Check, Copy, Loader2, XIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import JsonView from "ui/json-view";
import { NodeResultPopup } from "../workflow/node-result-popup";
import { cn } from "lib/utils";
import { NodeIcon } from "../workflow/node-icon";
import { TextShimmer } from "ui/text-shimmer";

interface WorkflowInvocationProps {
  result: VercelAIWorkflowToolStreamingResult;
}

import { ThesysRenderer } from "../thesys-renderer";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function PureWorkflowInvocation({ result }: WorkflowInvocationProps) {
  const { copied, copy } = useCopy();
  const savedResult = useRef<VercelAIWorkflowToolStreamingResult>(result);
  const [showDetails, setShowDetails] = useState(false);

  // Helper to extract Thesys content from result
  const thesysContent = useMemo(() => {
    if (!result.result) return null;

    // Check various common paths where the content might be
    const candidates = [
      result.result,
      (result.result as any).result,
      (result.result as any).answer,
      (result.result as any).response,
      (result.result as any).content,
      (result.result as any).output,
      (result.result as any).value,
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim().startsWith("<content")) {
        return c;
      }
    }
    return null;
  }, [result.result]);

  const output = useMemo(() => {
    if (result.status == "running") return null;
    if (result.status == "fail")
      return (
        <Alert variant={"destructive"} className="border-destructive">
          <AlertTriangleIcon className="size-3" />
          <AlertTitle>{result?.error?.name || "ERROR"}</AlertTitle>
          <AlertDescription>{result.error?.message}</AlertDescription>
        </Alert>
      );
    if (!result.result) return null;

    // If we have Thesys content, render it directly
    if (thesysContent) {
      return <ThesysRenderer content={thesysContent} />;
    }

    return (
      <div className="w-full bg-card p-4 border text-xs rounded-lg text-muted-foreground">
        <div className="flex items-center">
          <h5 className="text-muted-foreground font-medium select-none">
            Response
          </h5>
          <div className="flex-1" />
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-3 text-muted-foreground"
              onClick={() => copy(JSON.stringify(result.result))}
            >
              <Copy className="size-3" />
            </Button>
          )}
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto">
          <JsonView data={result.result} />
        </div>
      </div>
    );
  }, [result.status, result.error, result.result, copied, thesysContent]);

  useEffect(() => {
    if (result.status == "running") {
      savedResult.current = result;
    }
  }, [result]);

  const statusColor =
    result.status === "success"
      ? "text-green-500"
      : result.status === "fail"
        ? "text-red-500"
        : "text-blue-500";

  const hideDetails = result.status === "success" && !!thesysContent;

  return (
    <div className="w-full flex flex-col gap-1">
      {!hideDetails && (
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground flex gap-1 items-center"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Workflow Steps
            {result.status !== "running" && (
              <span
                className={cn(
                  "text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-muted uppercase",
                  statusColor,
                )}
              >
                {result.status}
              </span>
            )}
          </Button>
        </div>
      )}

      {!hideDetails &&
        showDetails &&
        result.history.map((item, i) => {
          const result = item.result || savedResult.current.history[i]?.result;
          return (
            <NodeResultPopup
              key={item.id}
              disabled={!result}
              history={{
                name: item.name,
                status: item.status,
                startedAt: item.startedAt,
                endedAt: item.endedAt,
                error: item.error?.message,
                result,
              }}
            >
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 text-sm rounded-sm px-2 py-1.5 relative",
                  item.status == "fail" && "text-destructive",
                  !!result && "cursor-pointer hover:bg-secondary",
                )}
              >
                <div className="border rounded overflow-hidden">
                  <NodeIcon
                    type={item.kind}
                    iconClassName="size-3"
                    className="rounded-none"
                  />
                </div>
                {item.status == "running" ? (
                  <TextShimmer className="font-semibold">
                    {`${item.name} Running...`}
                  </TextShimmer>
                ) : (
                  <span className="font-semibold">{item.name}</span>
                )}
                <span
                  className={cn(
                    "ms-auto text-xs",
                    item.status != "fail" && "text-muted-foreground",
                  )}
                >
                  {item.status != "running" &&
                    ((item.endedAt! - item.startedAt!) / 1000).toFixed(2)}
                </span>
                {item.status == "success" ? (
                  <Check className="size-3" />
                ) : item.status == "fail" ? (
                  <XIcon className="size-3" />
                ) : (
                  <Loader2 className="size-3 animate-spin" />
                )}
              </div>
            </NodeResultPopup>
          );
        })}
      <div className="mt-2 text-foreground font-normal">{output}</div>
    </div>
  );
}

function areEqual(
  prev: WorkflowInvocationProps,
  next: WorkflowInvocationProps,
) {
  if (prev.result.status != next.result.status) return false;
  if (prev.result.error?.message != next.result.error?.message) return false;
  if (prev.result.result != next.result.result) return false;
  if (!equal(prev.result.history, next.result.history)) return false;
  if (!equal(prev.result.result, next.result.result)) return false;
  return true;
}

export const WorkflowInvocation = memo(PureWorkflowInvocation, areEqual);
