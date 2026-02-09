"use client";

import { useReactFlow } from "@xyflow/react";
import { StorageNodeData, UINode } from "lib/ai/workflow/workflow.interface";
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

interface StorageNodeConfigProps {
  data: StorageNodeData;
}

export const StorageNodeConfig = memo(function StorageNodeConfig({
  data,
}: StorageNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const handleKeyChange = useCallback(
    (storageKey: string) => {
      updateNodeData(data.id, { storageKey });
    },
    [data.id, updateNodeData],
  );

  const handleKeySourceChange = useCallback(
    (source: { nodeId: string; path: string[] }) => {
      updateNodeData(data.id, {
        storageKey: { nodeId: source.nodeId, path: source.path },
      });
    },
    [data.id, updateNodeData],
  );

  const handleValueSourceChange = useCallback(
    (source: { nodeId: string; path: string[] }) => {
      updateNodeData(data.id, {
        storageValue: { nodeId: source.nodeId, path: source.path },
      });
    },
    [data.id, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm px-4">
      {/* Operation */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.storageOperation")}</Label>
        <Select
          disabled={!editable}
          value={data.operation}
          onValueChange={(v) =>
            updateNodeData(data.id, {
              operation: v as "get" | "set" | "delete" | "list",
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="get">{t("Workflow.storageGet")}</SelectItem>
            <SelectItem value="set">{t("Workflow.storageSet")}</SelectItem>
            <SelectItem value="delete">
              {t("Workflow.storageDelete")}
            </SelectItem>
            <SelectItem value="list">{t("Workflow.storageList")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key (not needed for list) */}
      {data.operation !== "list" && (
        <div>
          <Label className="text-sm mb-1">{t("Workflow.storageKey")}</Label>
          <div className="flex items-center gap-2">
            {typeof data.storageKey === "string" ? (
              <Input
                disabled={!editable}
                value={data.storageKey || ""}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="my-key"
                className="flex-1 h-8 text-xs"
              />
            ) : (
              <span className="text-xs truncate flex-1">
                {data.storageKey?.path?.join(".") || ""}
              </span>
            )}
            <VariableSelect
              currentNodeId={data.id}
              allowedTypes={["string"]}
              onChange={handleKeySourceChange}
            >
              <Button
                disabled={!editable}
                variant="outline"
                size="sm"
                className="h-8 px-2"
              >
                <VariableIcon className="size-3" />
              </Button>
            </VariableSelect>
          </div>
        </div>
      )}

      {/* Value (only for set) */}
      {data.operation === "set" && (
        <div>
          <Label className="text-sm mb-1">{t("Workflow.storageValue")}</Label>
          <VariableSelect
            currentNodeId={data.id}
            onChange={handleValueSourceChange}
          >
            <Button
              disabled={!editable}
              variant="outline"
              className="w-full justify-start h-8 text-xs"
            >
              {data.storageValue ? (
                <span className="truncate">
                  {data.storageValue.path.join(".")}
                </span>
              ) : (
                <>
                  <VariableIcon className="size-3 mr-1" />
                  {t("Workflow.storageSelectValue")}
                </>
              )}
            </Button>
          </VariableSelect>
        </div>
      )}

      {/* TTL (only for set) */}
      {data.operation === "set" && (
        <div>
          <Label className="text-sm mb-1">{t("Workflow.storageTtl")}</Label>
          <div className="flex items-center gap-2">
            <Input
              disabled={!editable}
              type="number"
              value={data.ttlMs || 0}
              onChange={(e) =>
                updateNodeData(data.id, {
                  ttlMs: parseInt(e.target.value) || 0,
                })
              }
              className="w-28 h-8 text-xs"
              min={0}
            />
            <span className="text-xs text-muted-foreground">
              ms (0 = no expiry)
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
