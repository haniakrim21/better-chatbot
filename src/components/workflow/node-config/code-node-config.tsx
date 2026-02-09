"use client";

import { useReactFlow } from "@xyflow/react";
import { CodeNodeData, UINode } from "lib/ai/workflow/workflow.interface";
import { PlusIcon, Trash2Icon, VariableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { useWorkflowStore } from "@/app/store/workflow.store";
import { VariableSelect } from "../variable-select";

interface CodeNodeConfigProps {
  data: CodeNodeData;
}

export const CodeNodeConfig = memo(function CodeNodeConfig({
  data,
}: CodeNodeConfigProps) {
  const t = useTranslations();
  const { updateNodeData } = useReactFlow<UINode>();
  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const handleCodeChange = useCallback(
    (code: string) => {
      updateNodeData(data.id, { code });
    },
    [data.id, updateNodeData],
  );

  const handleTimeoutChange = useCallback(
    (timeout: number) => {
      updateNodeData(data.id, { timeout });
    },
    [data.id, updateNodeData],
  );

  const handleAddMapping = useCallback(() => {
    updateNodeData(data.id, {
      inputMappings: [
        ...(data.inputMappings || []),
        { variableName: "", source: undefined },
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

  const handleMappingVarChange = useCallback(
    (index: number, variableName: string) => {
      const mappings = [...(data.inputMappings || [])];
      mappings[index] = { ...mappings[index], variableName };
      updateNodeData(data.id, { inputMappings: mappings });
    },
    [data.id, data.inputMappings, updateNodeData],
  );

  const handleMappingSourceChange = useCallback(
    (
      index: number,
      source: { nodeId: string; path: string[]; nodeName: string },
    ) => {
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
      {/* Input Mappings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">{t("Workflow.codeInputMappings")}</Label>
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
                value={mapping.variableName}
                onChange={(e) => handleMappingVarChange(index, e.target.value)}
                placeholder="variableName"
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

      {/* Code Editor */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.codeEditor")}</Label>
        <Textarea
          disabled={!editable}
          value={data.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder='// Write JavaScript code here\nreturn { result: "hello" };'
          className="font-mono text-xs min-h-48 resize-none"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Workflow.codeHelp")}
        </p>
      </div>

      {/* Timeout */}
      <div>
        <Label className="text-sm mb-1">{t("Workflow.codeTimeout")}</Label>
        <div className="flex items-center gap-2">
          <Input
            disabled={!editable}
            type="number"
            value={data.timeout || 5000}
            onChange={(e) =>
              handleTimeoutChange(parseInt(e.target.value) || 5000)
            }
            className="w-24 h-8 text-xs"
            min={100}
            max={30000}
          />
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
      </div>
    </div>
  );
});
