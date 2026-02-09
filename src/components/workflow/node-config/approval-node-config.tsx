"use client";

import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { TipTapMentionJsonContent } from "app-types/util";
import { ApprovalNodeData, UINode } from "lib/ai/workflow/workflow.interface";
import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
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
import { OutputSchemaMentionInput } from "../output-schema-mention-input";

interface ApprovalNodeConfigProps {
  data: ApprovalNodeData;
}

export const ApprovalNodeConfig = memo(function ApprovalNodeConfig({
  data,
}: ApprovalNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const nodes = useNodes() as UINode[];
  const edges = useEdges();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const handleMessageChange = useCallback(
    (message: TipTapMentionJsonContent) => {
      updateNodeData(data.id, { message });
    },
    [data.id, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm px-4">
      {/* Approval Message */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.approvalMessage")}</Label>
        <div className="w-full bg-secondary rounded-md p-2">
          <OutputSchemaMentionInput
            className="min-h-24"
            currentNodeId={data.id}
            nodes={nodes}
            edges={edges}
            content={data.message}
            onChange={handleMessageChange}
            editable={editable}
          />
        </div>
      </div>

      {/* On Timeout Behavior */}
      <div>
        <Label className="text-sm mb-1">
          {t("Workflow.approvalOnTimeout")}
        </Label>
        <Select
          disabled={!editable}
          value={data.onTimeout}
          onValueChange={(v) =>
            updateNodeData(data.id, {
              onTimeout: v as "approve" | "reject" | "stop",
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stop">
              {t("Workflow.approvalOnTimeoutStop")}
            </SelectItem>
            <SelectItem value="approve">
              {t("Workflow.approvalOnTimeoutApprove")}
            </SelectItem>
            <SelectItem value="reject">
              {t("Workflow.approvalOnTimeoutReject")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeout */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.approvalTimeout")}</Label>
        <div className="flex items-center gap-2">
          <Input
            disabled={!editable}
            type="number"
            value={data.timeoutMs}
            onChange={(e) =>
              updateNodeData(data.id, {
                timeoutMs: parseInt(e.target.value) || 300000,
              })
            }
            className="w-28 h-8 text-xs"
            min={5000}
            max={600000}
          />
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {data.timeoutMs >= 60000
            ? `${(data.timeoutMs / 60000).toFixed(1)} min`
            : `${(data.timeoutMs / 1000).toFixed(0)}s`}
        </p>
      </div>
    </div>
  );
});
