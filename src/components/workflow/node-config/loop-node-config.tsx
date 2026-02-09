"use client";

import { useReactFlow } from "@xyflow/react";
import { LoopNodeData, UINode } from "lib/ai/workflow/workflow.interface";
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

interface LoopNodeConfigProps {
  data: LoopNodeData;
}

export const LoopNodeConfig = memo(function LoopNodeConfig({
  data,
}: LoopNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const handleArraySourceChange = useCallback(
    (source: { nodeId: string; path: string[] }) => {
      updateNodeData(data.id, {
        arraySource: { nodeId: source.nodeId, path: source.path },
      });
    },
    [data.id, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm px-4">
      {/* Array Source */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.loopArraySource")}</Label>
        <VariableSelect
          currentNodeId={data.id}
          allowedTypes={["array"]}
          onChange={handleArraySourceChange}
        >
          <Button
            disabled={!editable}
            variant="outline"
            className="w-full justify-start h-8 text-xs"
          >
            {data.arraySource ? (
              <span className="truncate">
                {data.arraySource.path.join(".")}
              </span>
            ) : (
              <>
                <VariableIcon className="size-3 mr-1" />
                {t("Workflow.selectArraySource")}
              </>
            )}
          </Button>
        </VariableSelect>
      </div>

      {/* Item Variable Name */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.loopItemVariable")}</Label>
        <Input
          disabled={!editable}
          value={data.itemVariable}
          onChange={(e) =>
            updateNodeData(data.id, { itemVariable: e.target.value })
          }
          placeholder="item"
          className="h-8 text-xs"
        />
      </div>

      {/* Index Variable Name */}
      <div>
        <Label className="text-sm mb-1">
          {t("Workflow.loopIndexVariable")}
        </Label>
        <Input
          disabled={!editable}
          value={data.indexVariable}
          onChange={(e) =>
            updateNodeData(data.id, { indexVariable: e.target.value })
          }
          placeholder="index"
          className="h-8 text-xs"
        />
      </div>

      {/* Mode */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.loopMode")}</Label>
        <Select
          disabled={!editable}
          value={data.mode}
          onValueChange={(value) =>
            updateNodeData(data.id, {
              mode: value as "sequential" | "parallel",
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">
              {t("Workflow.loopSequential")}
            </SelectItem>
            <SelectItem value="parallel">
              {t("Workflow.loopParallel")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Iterations */}
      <div>
        <Label className="text-sm mb-1">
          {t("Workflow.loopMaxIterations")}
        </Label>
        <Input
          disabled={!editable}
          type="number"
          value={data.maxIterations}
          onChange={(e) =>
            updateNodeData(data.id, {
              maxIterations: parseInt(e.target.value) || 100,
            })
          }
          className="w-24 h-8 text-xs"
          min={1}
          max={1000}
        />
      </div>
    </div>
  );
});
