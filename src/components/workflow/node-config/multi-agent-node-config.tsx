import { MultiAgentNodeData, UINode } from "lib/ai/workflow/workflow.interface";
import { Label } from "ui/label";
import { Input } from "ui/input";
import { memo, useCallback } from "react";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { useWorkflowStore } from "@/app/store/workflow.store";
import { useAgents } from "@/hooks/queries/use-agents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { OutputSchemaMentionInput } from "../output-schema-mention-input";
import { Edge } from "@xyflow/react";
import { Separator } from "ui/separator";

export const MultiAgentNodeConfig = memo(function ({
  data,
}: {
  data: MultiAgentNodeData;
}) {
  const { updateNodeData } = useReactFlow<UINode>();
  const { agents } = useAgents();

  const nodes = useNodes() as UINode[];
  const edges = useEdges() as Edge[];

  const editable = useWorkflowStore((state) => {
    return (
      state.processIds.length === 0 &&
      state.hasEditAccess &&
      !state.workflow?.isPublished
    );
  });

  const updateField = useCallback(
    (field: keyof MultiAgentNodeData, value: any) => {
      updateNodeData(data.id, { [field]: value });
    },
    [data.id, updateNodeData],
  );

  return (
    <div className="flex flex-col gap-4 text-sm h-full px-4">
      <div className="grid gap-2">
        <Label className="text-sm font-semibold">Role A (Inception)</Label>
        <AgentSelector
          agents={agents || []}
          value={data.roleAId}
          onSelect={(id) => updateField("roleAId", id)}
          placeholder="Select Inception Agent"
          disabled={!editable}
        />
        <p className="text-xs text-muted-foreground">
          This agent provides instructions and feedback.
        </p>
      </div>

      <div className="grid gap-2">
        <Label className="text-sm font-semibold">Role B (Execution)</Label>
        <AgentSelector
          agents={agents || []}
          value={data.roleBId}
          onSelect={(id) => updateField("roleBId", id)}
          placeholder="Select Assistant Agent"
          disabled={!editable}
        />
        <p className="text-xs text-muted-foreground">
          This agent executes the instructions.
        </p>
      </div>

      <Separator className="my-2" />

      <div className="grid gap-2">
        <Label className="text-sm font-semibold">Collaboration Task</Label>
        <OutputSchemaMentionInput
          currentNodeId={data.id}
          nodes={nodes}
          edges={edges}
          content={data.taskDescription}
          editable={editable}
          onChange={(content) => updateField("taskDescription", content)}
          placeholder="Define the task objective..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="maxTurns" className="text-sm font-semibold">
          Max Iterations (Turns)
        </Label>
        <Input
          id="maxTurns"
          type="number"
          min={2}
          max={50}
          value={data.maxTurns}
          onChange={(e) =>
            updateField("maxTurns", parseInt(e.target.value) || 10)
          }
          disabled={!editable}
          className="w-24"
        />
      </div>
    </div>
  );
});

function AgentSelector({
  agents,
  value,
  onSelect,
  placeholder,
  disabled,
}: {
  agents: any[];
  value?: string;
  onSelect: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const selectedAgent = agents.find((a) => a.id === value);

  return (
    <Select value={value} onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedAgent ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarImage src={selectedAgent.icon?.value} />
                <AvatarFallback>{selectedAgent.name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedAgent.name}</span>
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            <div className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarImage src={agent.icon?.value} />
                <AvatarFallback>{agent.name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{agent.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

MultiAgentNodeConfig.displayName = "MultiAgentNodeConfig";
