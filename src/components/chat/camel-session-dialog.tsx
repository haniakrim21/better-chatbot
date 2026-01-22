"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { useAgents } from "@/hooks/queries/use-agents";
import { AgentSummary } from "app-types/agent";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Check, ChevronsUpDown, Users2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

interface CamelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: string;
  roleA?: AgentSummary | null;
  roleB?: AgentSummary | null;
  onStart: (config: {
    task: string;
    roleA: AgentSummary;
    roleB: AgentSummary;
    turns: number;
  }) => void;
}

export function CamelSessionDialog({
  open,
  onOpenChange,
  initialTask = "",
  roleA: initialRoleA = null,
  roleB: initialRoleB = null,
  onStart,
}: CamelSessionDialogProps) {
  const [task, setTask] = useState(initialTask);
  const [turns, setTurns] = useState(10);
  const [agentA, setAgentA] = useState<AgentSummary | null>(initialRoleA);
  const [agentB, setAgentB] = useState<AgentSummary | null>(initialRoleB);

  useEffect(() => {
    if (initialRoleA) setAgentA(initialRoleA);
  }, [initialRoleA]);

  useEffect(() => {
    if (initialRoleB) setAgentB(initialRoleB);
  }, [initialRoleB]);

  // Correct hook usage: useAgents returns { agents, ... }
  const { agents } = useAgents();

  const handleStart = () => {
    if (!task.trim()) {
      toast.error("Please provide a task description");
      return;
    }
    if (!agentA || !agentB) {
      toast.error("Please select both agents for the collaboration");
      return;
    }
    if (agentA.id === agentB.id) {
      toast.error("Please select two different agents");
      return;
    }

    onStart({
      task,
      roleA: agentA,
      roleB: agentB,
      turns: turns,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-background/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="size-5 text-primary" />
            Multi-Agent Session
          </DialogTitle>
          <DialogDescription>
            Two agents will collaborate autonomously to solve your task.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task">Task Objective</Label>
            <Textarea
              id="task"
              placeholder="e.g. Plan a marketing campaign for a new coffee brand..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Agent A (Inception)</Label>
              <AgentSelector
                agents={agents || []}
                selected={agentA}
                onSelect={setAgentA}
                placeholder="User Agent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Agent B (Execution)</Label>
              <AgentSelector
                agents={agents || []}
                selected={agentB}
                onSelect={setAgentB}
                placeholder="Assistant Agent"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="turns">Max Iterations (Turns)</Label>
            <Input
              id="turns"
              type="number"
              min={2}
              max={50}
              value={turns}
              onChange={(e) => setTurns(parseInt(e.target.value) || 10)}
            />
            <p className="text-xs text-muted-foreground">
              Number of cooperative turns before the session automatically ends.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant={"ghost"} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} className="gap-2">
            <Users2 className="size-4" />
            Launch Autonomous Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgentSelector({
  agents,
  selected,
  onSelect,
  placeholder,
}: {
  agents: AgentSummary[];
  selected: AgentSummary | null;
  onSelect: (a: AgentSummary) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="size-4">
                <AvatarImage src={selected.icon?.value} />
                <AvatarFallback>{selected.name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{selected.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search agent..." />
          <CommandList>
            <CommandEmpty>No agent found.</CommandEmpty>
            <CommandGroup>
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={agent.name}
                  onSelect={() => {
                    onSelect(agent);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected?.id === agent.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="size-4">
                      <AvatarImage src={agent.icon?.value} />
                      <AvatarFallback>{agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{agent.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
