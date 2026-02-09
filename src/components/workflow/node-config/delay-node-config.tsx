"use client";

import { useReactFlow } from "@xyflow/react";
import { DelayNodeData, UINode } from "lib/ai/workflow/workflow.interface";
import { VariableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useWorkflowStore } from "@/app/store/workflow.store";
import { VariableSelect } from "../variable-select";

interface DelayNodeConfigProps {
  data: DelayNodeData;
}

export const DelayNodeConfig = memo(function DelayNodeConfig({
  data,
}: DelayNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const handleDelayTypeChange = useCallback(
    (delayType: "fixed" | "dynamic") => {
      updateNodeData(data.id, { delayType });
    },
    [data.id, updateNodeData],
  );

  const handleDelayMsChange = useCallback(
    (delayMs: number) => {
      updateNodeData(data.id, { delayMs });
    },
    [data.id, updateNodeData],
  );

  const handleDynamicSourceChange = useCallback(
    (source: { nodeId: string; path: string[] }) => {
      updateNodeData(data.id, {
        dynamicSource: { nodeId: source.nodeId, path: source.path },
      });
    },
    [data.id, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm px-4">
      {/* Delay Type */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.delayType")}</Label>
        <Select
          disabled={!editable}
          value={data.delayType}
          onValueChange={(v) => handleDelayTypeChange(v as "fixed" | "dynamic")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">{t("Workflow.delayFixed")}</SelectItem>
            <SelectItem value="dynamic">
              {t("Workflow.delayDynamic")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fixed Delay */}
      {data.delayType === "fixed" && (
        <div>
          <Label className="text-sm mb-1">{t("Workflow.delayDuration")}</Label>
          <div className="flex items-center gap-2">
            <Input
              disabled={!editable}
              type="number"
              value={data.delayMs}
              onChange={(e) =>
                handleDelayMsChange(parseInt(e.target.value) || 0)
              }
              className="w-32 h-8 text-xs"
              min={0}
              max={300000}
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.delayMs >= 1000
              ? `${(data.delayMs / 1000).toFixed(1)}s`
              : `${data.delayMs}ms`}
          </p>
        </div>
      )}

      {/* Dynamic Delay Source */}
      {data.delayType === "dynamic" && (
        <div>
          <Label className="text-sm mb-1">{t("Workflow.delaySource")}</Label>
          <VariableSelect
            currentNodeId={data.id}
            allowedTypes={["number"]}
            onChange={handleDynamicSourceChange}
          >
            <Button
              disabled={!editable}
              variant="outline"
              className="w-full justify-start h-8 text-xs"
            >
              {data.dynamicSource ? (
                <span className="truncate">
                  {data.dynamicSource.path.join(".")}
                </span>
              ) : (
                <>
                  <VariableIcon className="size-3 mr-1" />
                  {t("Workflow.selectDelaySource")}
                </>
              )}
            </Button>
          </VariableSelect>
          <p className="text-xs text-muted-foreground mt-1">
            {t("Workflow.delayDynamicHelp")}
          </p>
        </div>
      )}
    </div>
  );
});
