"use client";

import { useReactFlow } from "@xyflow/react";
import {
  SubWorkflowNodeData,
  UINode,
} from "lib/ai/workflow/workflow.interface";
import { PlusIcon, Trash2Icon, VariableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
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

interface SubWorkflowNodeConfigProps {
  data: SubWorkflowNodeData;
}

type WorkflowOption = {
  id: string;
  name: string;
  description?: string;
};

export const SubWorkflowNodeConfig = memo(function SubWorkflowNodeConfig({
  data,
}: SubWorkflowNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);

  useEffect(() => {
    fetch("/api/workflow")
      .then((res) => res.json())
      .then((data) => setWorkflows(data))
      .catch(() => setWorkflows([]));
  }, []);

  const handleWorkflowChange = useCallback(
    (workflowId: string) => {
      const wf = workflows.find((w) => w.id === workflowId);
      updateNodeData(data.id, {
        workflowId,
        workflowName: wf?.name || "Unknown",
      });
    },
    [data.id, updateNodeData, workflows],
  );

  const handleAddMapping = useCallback(() => {
    updateNodeData(data.id, {
      inputMappings: [
        ...(data.inputMappings || []),
        { key: "", source: undefined },
      ],
    });
  }, [data.id, data.inputMappings, updateNodeData]);

  const handleRemoveMapping = useCallback(
    (index: number) => {
      const mappings = [...(data.inputMappings || [])];
      mappings.splice(index, 1);
      updateNodeData(data.id, { inputMappings: mappings });
    },
    [data.id, data.inputMappings, updateNodeData],
  );

  const handleMappingKeyChange = useCallback(
    (index: number, key: string) => {
      const mappings = [...(data.inputMappings || [])];
      mappings[index] = { ...mappings[index], key };
      updateNodeData(data.id, { inputMappings: mappings });
    },
    [data.id, data.inputMappings, updateNodeData],
  );

  const handleMappingSourceChange = useCallback(
    (index: number, source: { nodeId: string; path: string[] }) => {
      const mappings = [...(data.inputMappings || [])];
      mappings[index] = {
        ...mappings[index],
        source: { nodeId: source.nodeId, path: source.path },
      };
      updateNodeData(data.id, { inputMappings: mappings });
    },
    [data.id, data.inputMappings, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm px-4">
      {/* Workflow Selection */}
      <div>
        <Label className="text-sm mb-1">
          {t("Workflow.subWorkflowSelect")}
        </Label>
        <Select
          disabled={!editable}
          value={data.workflowId || ""}
          onValueChange={handleWorkflowChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t("Workflow.subWorkflowPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {workflows.map((wf) => (
              <SelectItem key={wf.id} value={wf.id}>
                {wf.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input Mappings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">
            {t("Workflow.subWorkflowInputMappings")}
          </Label>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddMapping}
              className="h-6 px-2"
            >
              <PlusIcon className="size-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {(data.inputMappings || []).map((mapping, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                disabled={!editable}
                value={mapping.key}
                onChange={(e) => handleMappingKeyChange(index, e.target.value)}
                placeholder="inputKey"
                className="flex-1 text-xs h-8"
              />
              <VariableSelect
                currentNodeId={data.id}
                onChange={(item) => handleMappingSourceChange(index, item)}
              >
                <Button
                  disabled={!editable}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  {mapping.source ? (
                    <span className="truncate max-w-20">
                      {mapping.source.path.join(".")}
                    </span>
                  ) : (
                    <VariableIcon className="size-3" />
                  )}
                </Button>
              </VariableSelect>
              {editable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMapping(index)}
                  className="h-8 px-1"
                >
                  <Trash2Icon className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeout */}
      <div>
        <Label className="text-sm mb-1">
          {t("Workflow.subWorkflowTimeout")}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            disabled={!editable}
            type="number"
            value={data.timeout || 300000}
            onChange={(e) =>
              updateNodeData(data.id, {
                timeout: parseInt(e.target.value) || 300000,
              })
            }
            className="w-28 h-8 text-xs"
            min={1000}
            max={600000}
          />
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
      </div>
    </div>
  );
});
