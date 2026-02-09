"use client";

import { AgentSummary } from "app-types/agent";
import { ChatMention } from "app-types/chat";
import { AllowedMCPServer, MCPServerInfo } from "app-types/mcp";
import { WorkflowSummary } from "app-types/workflow";
import { authClient } from "auth/client";
import { redriectMcpOauth } from "lib/ai/mcp/oauth-redirect";
import { AppDefaultToolkit } from "lib/ai/tools";
import { cn, objectFlow } from "lib/utils";
import {
  ArrowUpRightIcon,
  AtSign,
  ChartColumn,
  ChevronRight,
  CodeIcon,
  GlobeIcon,
  HardDriveUploadIcon,
  InfoIcon,
  Loader,
  MessageCircle,
  MousePointer2,
  Package,
  Plus,
  ShieldAlertIcon,
  Waypoints,
  Wrench,
  WrenchIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { CountAnimation } from "ui/count-animation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Input } from "ui/input";
import { MCPIcon } from "ui/mcp-icon";
import { Separator } from "ui/separator";
import { handleErrorWithToast } from "ui/shared-toast";
import { Switch } from "ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useShallow } from "zustand/shallow";
import { appStore } from "@/app/store";
import { useAgents } from "@/hooks/queries/use-agents";
import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { useWorkflowToolList } from "@/hooks/queries/use-workflow-tool-list";
import { KnowledgeBaseSelector } from "./knowledge-base-selector";
import { WorkflowGreeting } from "./workflow/workflow-greeting";

interface ToolSelectDropdownProps {
  align?: "start" | "end" | "center";
  side?: "left" | "right" | "top" | "bottom";
  disabled?: boolean;
  mentions?: ChatMention[];
  onSelectWorkflow?: (workflow: WorkflowSummary) => void;
  onSelectAgent?: (agent: AgentSummary) => void;
  onSelectKB?: (kbId: string) => void;
  onGenerateImage?: (provider?: "google" | "openai") => void;
  className?: string;
}

const calculateToolCount = (
  allowedMcpServers: Record<string, AllowedMCPServer>,
  mcpList: (MCPServerInfo & { id: string })[],
) => {
  return mcpList.reduce((acc, server) => {
    const count = allowedMcpServers[server.id]?.tools?.length ?? 0;
    return acc + count;
  }, 0);
};

export function ToolSelectDropdown({
  align,
  side,
  onSelectWorkflow,
  onSelectAgent,
  onGenerateImage,
  onSelectKB,
  mentions,
  className,
}: ToolSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [toolChoice, allowedAppDefaultToolkit, allowedMcpServers, mcpList] =
    appStore(
      useShallow((state) => [
        state.toolChoice,
        state.allowedAppDefaultToolkit,
        state.allowedMcpServers,
        state.mcpList,
      ]),
    );

  const t = useTranslations("Chat.Tool");
  const { isLoading } = useMcpList();

  useWorkflowToolList({
    refreshInterval: 1000 * 60 * 5,
  });

  const agentMention = useMemo(() => {
    return mentions?.find((m) => m.type === "agent");
  }, [mentions]);

  const bindingTools = useMemo<string[]>(() => {
    if (mentions?.length) {
      return mentions.map((m) => m.name);
    }
    if (toolChoice == "none") return [];
    const translate = t.raw("defaultToolKit");
    const defaultTools = Object.values(AppDefaultToolkit)
      .filter((t) => allowedAppDefaultToolkit?.includes(t))
      .map((t) => translate[t]);
    const mcpIds = mcpList.map((v) => v.id);
    const mcpTools = Object.values(
      objectFlow(allowedMcpServers ?? {}).filter((_, id) =>
        mcpIds.includes(id),
      ),
    )
      .map((v) => v.tools)
      .flat();

    return [...defaultTools, ...mcpTools];
  }, [
    mentions,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    toolChoice,
    mcpList,
    t,
  ]);

  const triggerButton = useMemo(() => {
    return (
      <Button
        variant="ghost"
        size={"sm"}
        className={cn(
          "gap-0.5 bg-input/60 border rounded-full data-[state=open]:bg-input! hover:bg-input!",
          !bindingTools.length &&
            !isLoading &&
            "text-muted-foreground bg-transparent border-transparent",
          isLoading && "bg-input/60",
          open && "bg-input!",
          className,
        )}
      >
        <span className={!bindingTools ? "text-muted-foreground" : ""}>
          {agentMention
            ? "Agent"
            : (mentions?.length ?? 0 > 0)
              ? "Mention"
              : "Tools"}
        </span>

        {((!agentMention && bindingTools.length > 0) || isLoading) && (
          <>
            <div className="h-4 hidden sm:block mx-1">
              <Separator orientation="vertical" />
            </div>

            <div className="min-w-5 flex justify-center">
              {isLoading ? (
                <Loader className="animate-spin size-3.5" />
              ) : (mentions?.length ?? 0) > 0 ? (
                <AtSign className="size-3.5" />
              ) : (
                <CountAnimation
                  number={bindingTools.length}
                  className="text-xs"
                />
              )}
            </div>
          </>
        )}
      </Button>
    );
  }, [
    mentions?.length,
    bindingTools.length,
    isLoading,
    open,
    agentMention,
    className,
  ]);

  useEffect(() => {
    if (bindingTools.length > 128) {
      toast("Too many tools selected, please select less than 128 tools");
    }
  }, [bindingTools.length]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
            <TooltipContent align={align} side={side} className="p-4 text-xs  ">
              <div className="flex items-center gap-2">
                <WrenchIcon className="size-3.5" />
                <span className="text-sm">{t("toolsSetup")}</span>
              </div>

              <p className="text-muted-foreground mt-4 whitespace-pre-wrap">
                {t("toolsSetupDescription")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="md:w-72" align={align} side={side}>
        <WorkflowToolSelector
          onSelectWorkflow={(w) => {
            onSelectWorkflow?.(w);
            setOpen(false);
            toast.success(`Workflow "${w.name}" selected`);
          }}
        />
        <div className="py-1">
          <DropdownMenuSeparator />
        </div>
        <AgentSelector
          onSelectAgent={(a) => {
            onSelectAgent?.(a);
            setOpen(false);
            toast.success(`Agent "${a.name}" selected`);
          }}
        />
        <div className="py-1">
          <DropdownMenuSeparator />
        </div>

        <KnowledgeBaseSelector
          onSelectKB={(kbId) => {
            onSelectKB?.(kbId);
            setOpen(false);
          }}
        />
        <div className="py-1">
          <DropdownMenuSeparator />
        </div>
        <div className="py-2">
          <ToolPresets />
          <div className="py-1">
            <DropdownMenuSeparator />
          </div>
          <AppDefaultToolKitSelector />
          <div className="py-1">
            <DropdownMenuSeparator />
          </div>
          <McpServerSelector />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DefaultToolSwitch({
  toolkit,
  label,
  icon: Icon,
  checked,
  onToggle,
}: {
  toolkit: AppDefaultToolkit;
  label: string;
  icon: any;
  checked: boolean;
  onToggle: (toolkit: AppDefaultToolkit) => void;
}) {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle(toolkit);
    if (!checked) {
      toast.success(`${label} activated`);
    } else {
      toast(`${label} deactivated`);
    }
  };

  return (
    <DropdownMenuItem
      className={cn(
        "cursor-pointer font-semibold text-xs text-muted-foreground",
        checked && "text-foreground",
      )}
      onClick={handleToggle}
    >
      <Icon className={cn("size-3.5", checked && "text-foreground")} />
      {label}
      <Switch className="ms-auto" checked={checked} />
    </DropdownMenuItem>
  );
}

function ToolPresets() {
  const [
    appStoreMutate,
    presets,
    allowedMcpServers,
    allowedAppDefaultToolkit,
    mcpList,
  ] = appStore(
    useShallow((state) => [
      state.mutate,
      state.toolPresets,
      state.allowedMcpServers,
      state.allowedAppDefaultToolkit,
      state.mcpList,
    ]),
  );
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();

  // Fetch presets from server on mount
  useEffect(() => {
    fetch("/api/preset")
      .then((res) => (res.ok ? res.json() : []))
      .then((serverPresets: any[]) => {
        if (serverPresets.length > 0) {
          appStoreMutate({
            toolPresets: serverPresets.map((p) => ({
              id: p.id,
              name: p.name,
              allowedMcpServers: p.allowedMcpServers ?? undefined,
              allowedAppDefaultToolkit: p.allowedAppDefaultToolkit ?? undefined,
            })),
          });
        }
      })
      .catch(() => {
        // Silently fall back to local presets
      });
  }, [appStoreMutate]);

  const presetWithToolCount = useMemo(() => {
    return presets.map((preset) => ({
      ...preset,
      toolCount: calculateToolCount(preset.allowedMcpServers ?? {}, mcpList),
    }));
  }, [presets, mcpList]);

  const addPreset = useCallback(
    async (name: string) => {
      if (name.trim() === "") {
        toast.error(t("Chat.Tool.presetNameCannotBeEmpty"));
        return;
      }
      if (presets.find((p) => p.name === name)) {
        toast.error(t("Chat.Tool.presetNameAlreadyExists"));
        return;
      }

      setIsSaving(true);
      try {
        const res = await fetch("/api/preset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            allowedMcpServers,
            allowedAppDefaultToolkit,
          }),
        });

        if (!res.ok) throw new Error("Failed to save preset");

        const saved = await res.json();
        appStoreMutate((prev) => ({
          toolPresets: [
            ...prev.toolPresets,
            {
              id: saved.id,
              name: saved.name,
              allowedMcpServers: saved.allowedMcpServers ?? undefined,
              allowedAppDefaultToolkit:
                saved.allowedAppDefaultToolkit ?? undefined,
            },
          ],
        }));
        setPresetName("");
        setOpen(false);
        toast.success(t("Chat.Tool.presetSaved"));
      } catch {
        // Fallback: save locally only
        appStoreMutate((prev) => ({
          toolPresets: [
            ...prev.toolPresets,
            { name, allowedMcpServers, allowedAppDefaultToolkit },
          ],
        }));
        setPresetName("");
        setOpen(false);
        toast.success(t("Chat.Tool.presetSaved"));
      } finally {
        setIsSaving(false);
      }
    },
    [allowedMcpServers, allowedAppDefaultToolkit, presets, appStoreMutate, t],
  );

  const deletePreset = useCallback(
    (index: number) => {
      const preset = presets[index] as any;
      const presetId = preset?.id;

      // Remove from local store immediately
      appStoreMutate((prev) => ({
        toolPresets: prev.toolPresets.filter((_, i) => i !== index),
      }));

      // Delete from server if it has an id
      if (presetId) {
        fetch(`/api/preset/${presetId}`, { method: "DELETE" }).catch(() => {
          // Silently ignore server errors; local delete already applied
        });
      }
    },
    [appStoreMutate, presets],
  );

  const applyPreset = useCallback(
    (preset: (typeof presets)[number]) => {
      appStoreMutate({
        allowedMcpServers: preset.allowedMcpServers,
        allowedAppDefaultToolkit: preset.allowedAppDefaultToolkit,
      });
      toast.success(`Preset "${preset.name}" applied`);
    },
    [appStoreMutate],
  );

  return (
    <DropdownMenuGroup className="cursor-pointer">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs flex items-center gap-2 font-semibold cursor-pointer">
          <Package className="size-3.5" />
          {t("Chat.Tool.preset")}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="md:w-80 md:max-h-96 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center text-muted-foreground gap-2 text-xs">
              {t("Chat.Tool.toolPresets")}
              <div className="flex-1" />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant={"secondary"} size={"sm"} className="text-xs">
                    {t("Chat.Tool.saveAsPreset")}
                    <Plus className="size-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("Chat.Tool.saveAsPreset")}</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    {t("Chat.Tool.saveAsPresetDescription")}
                  </DialogDescription>
                  <Input
                    placeholder="Preset Name"
                    value={presetName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        addPreset(presetName);
                      }
                    }}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button
                    variant={"secondary"}
                    size={"sm"}
                    className="border"
                    disabled={isSaving}
                    onClick={() => {
                      addPreset(presetName);
                    }}
                  >
                    {isSaving && (
                      <Loader className="size-3.5 me-1 animate-spin" />
                    )}
                    {t("Common.save")}
                  </Button>
                </DialogContent>
              </Dialog>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {presets.length === 0 ? (
              <div className="text-sm text-muted-foreground w-full h-full flex flex-col items-center justify-center gap-2 py-6">
                <p>{t("Chat.Tool.noPresetsAvailableYet")}</p>
                <p className="text-xs px-4">
                  {t("Chat.Tool.clickSaveAsPresetToGetStarted")}
                </p>
              </div>
            ) : (
              presetWithToolCount.map((preset, index) => {
                return (
                  <DropdownMenuItem
                    onClick={() => {
                      applyPreset(preset);
                    }}
                    key={preset.name}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Badge
                      variant={"secondary"}
                      className="rounded-full border-input"
                    >
                      <Wrench className="size-3.5" />
                      <span className="min-w-6 text-center">
                        {preset.toolCount}
                      </span>
                    </Badge>
                    <span className="font-semibold truncate">
                      {preset.name}
                    </span>

                    <div className="flex-1" />
                    <div
                      className="p-1 hover:bg-input rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deletePreset(index);
                      }}
                    >
                      <X className="size-3.5" />
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}

function WorkflowToolSelector({
  onSelectWorkflow,
}: {
  onSelectWorkflow?: (workflow: WorkflowSummary) => void;
}) {
  const t = useTranslations();
  const workflowToolList = appStore((state) => state.workflowToolList);
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Separate user's workflows from shared workflows
  const myWorkflows = workflowToolList.filter(
    (w) => w.userId === currentUserId,
  );
  const sharedWorkflows = workflowToolList.filter(
    (w) => w.userId !== currentUserId,
  );
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs flex items-center gap-2 font-semibold cursor-pointer">
          <Waypoints className="size-3.5" />
          {t("Workflow.title")}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-80 relative">
            {myWorkflows.length === 0 && sharedWorkflows.length === 0 ? (
              <div className="text-sm text-muted-foreground flex flex-col py-6 px-6 gap-4 items-center">
                <InfoIcon className="size-4" />
                <p className="whitespace-pre-wrap">{t("Workflow.noTools")}</p>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={"ghost"} className="relative group">
                      {t("Workflow.whatIsWorkflow")}
                      <div className="absolute left-0 -top-1.5 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                        <MousePointer2 className="rotate-180 text-blue-500 fill-blue-500 size-3 wiggle" />
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="md:max-w-3xl!">
                    <DialogTitle className="sr-only">
                      workflow greeting
                    </DialogTitle>
                    <WorkflowGreeting />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <>
                {/* My Workflows */}
                {myWorkflows.map((workflow) => (
                  <DropdownMenuItem
                    key={workflow.id}
                    className="cursor-pointer"
                    onClick={() => onSelectWorkflow?.(workflow)}
                  >
                    {workflow.icon && workflow.icon.type === "emoji" ? (
                      <div
                        style={{
                          backgroundColor:
                            workflow.icon?.style?.backgroundColor,
                        }}
                        className="p-1 rounded flex items-center justify-center ring ring-background border"
                      >
                        <Avatar className="size-3">
                          <AvatarImage src={workflow.icon?.value} />
                          <AvatarFallback>
                            {workflow.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : null}
                    <span className="truncate min-w-0">{workflow.name}</span>
                  </DropdownMenuItem>
                ))}

                {myWorkflows.length > 0 && sharedWorkflows.length > 0 && (
                  <DropdownMenuSeparator />
                )}

                {/* Shared Workflows */}
                {sharedWorkflows.map((workflow) => (
                  <DropdownMenuItem
                    key={workflow.id}
                    className="cursor-pointer"
                    onClick={() => onSelectWorkflow?.(workflow)}
                  >
                    {workflow.icon && workflow.icon.type === "emoji" ? (
                      <div
                        style={{
                          backgroundColor:
                            workflow.icon?.style?.backgroundColor,
                        }}
                        className="p-1 rounded flex items-center justify-center ring ring-background border"
                      >
                        <Avatar className="size-3">
                          <AvatarImage src={workflow.icon?.value} />
                          <AvatarFallback>
                            {workflow.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate min-w-0">{workflow.name}</span>
                      {workflow.userName && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="size-4 ms-2 shrink-0">
                              <AvatarImage src={workflow.userAvatar} />
                              <AvatarFallback className="text-xs text-muted-foreground font-medium">
                                {workflow.userName[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("Common.sharedBy", {
                              userName: workflow.userName,
                            })}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}

function McpServerSelector() {
  const [appStoreMutate, allowedMcpServers, mcpServerList] = appStore(
    useShallow((state) => [
      state.mutate,
      state.allowedMcpServers,
      state.mcpList,
    ]),
  );

  const selectedMcpServerList = useMemo(() => {
    if (mcpServerList.length === 0) return [];
    return [...mcpServerList]
      .sort(
        (a, b) =>
          (a.status === "connected" ? -1 : 1) -
          (b.status === "connected" ? -1 : 1),
      )
      .map((server) => {
        const allowedTools: string[] =
          allowedMcpServers?.[server.id]?.tools ?? [];

        return {
          id: server.id,
          serverName: server.name,
          checked: allowedTools.length > 0,
          tools: server.toolInfo.map((tool) => ({
            name: tool.name,
            checked: allowedTools.includes(tool.name),
            description: tool.description,
          })),
          error: server.error,
          status: server.status,
        };
      });
  }, [mcpServerList, allowedMcpServers]);

  const setMcpServerTool = useCallback(
    (serverId: string, toolNames: string[]) => {
      appStoreMutate((prev) => {
        return {
          allowedMcpServers: {
            ...prev.allowedMcpServers,
            [serverId]: {
              ...(prev.allowedMcpServers?.[serverId] ?? {}),
              tools: toolNames,
            },
          },
        };
      });
    },
    [appStoreMutate],
  );
  return (
    <DropdownMenuGroup>
      {!selectedMcpServerList.length ? (
        <div className="text-sm text-muted-foreground w-full h-full flex flex-col items-center justify-center py-6">
          <div>No MCP servers detected.</div>
          <Link href="/mcp">
            <Button
              variant={"ghost"}
              className="mt-2 text-primary flex items-center gap-1"
            >
              Add a server <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      ) : (
        selectedMcpServerList.map((server) => (
          <DropdownMenuSub key={server.id}>
            <DropdownMenuSubTrigger
              className="flex items-center gap-2 font-semibold cursor-pointer"
              icon={
                <div className="flex items-center gap-2 ms-auto">
                  {server.status === "authorizing" ? (
                    <div className="flex items-center gap-1">
                      <ShieldAlertIcon className="size-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {server.tools.filter((t) => t.checked).length > 0 ? (
                        <span className="w-5 h-5 items-center justify-center flex text-[8px] text-muted-foreground font-semibold ">
                          {server.tools.filter((t) => t.checked).length}
                        </span>
                      ) : null}
                      <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                    </>
                  )}
                </div>
              }
              onClick={(e) => {
                e.preventDefault();
                setMcpServerTool(
                  server.id,
                  server.checked ? [] : server.tools.map((t) => t.name),
                );
              }}
            >
              <div className="flex items-center justify-center p-1 rounded bg-input/40 border">
                <MCPIcon className="fill-foreground size-2.5" />
              </div>

              <span className={cn("truncate", !server.checked && "opacity-30")}>
                {server.serverName}
              </span>
              {Boolean(server.error) ? (
                <span
                  className={cn("text-xs text-destructive ms-1 p-1 rounded")}
                >
                  error
                </span>
              ) : null}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-80 relative">
                <McpServerToolSelector
                  tools={server.tools}
                  isAuthorizing={server.status === "authorizing"}
                  checked={server.checked}
                  serverId={server.id}
                  onClickAllChecked={(checked) => {
                    setMcpServerTool(
                      server.id,
                      checked ? server.tools.map((t) => t.name) : [],
                    );
                  }}
                  onToolClick={(toolName, checked) => {
                    const currentTools = server.tools
                      .filter((v) => v.checked)
                      .map((v) => v.name);

                    setMcpServerTool(
                      server.id,
                      checked
                        ? currentTools.concat(toolName)
                        : currentTools.filter((v) => v !== toolName),
                    );
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))
      )}
    </DropdownMenuGroup>
  );
}

interface McpServerToolSelectorProps {
  tools: {
    name: string;
    checked: boolean;
    description: string;
  }[];
  isAuthorizing: boolean;
  serverId: string;
  onClickAllChecked: (checked: boolean) => void;
  checked: boolean;
  onToolClick: (toolName: string, checked: boolean) => void;
}
function McpServerToolSelector({
  tools,
  serverId,
  onClickAllChecked,
  isAuthorizing,
  checked,
  onToolClick,
}: McpServerToolSelectorProps) {
  const t = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const filteredTools = useMemo(() => {
    return tools.filter((tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [tools, search]);

  const handleAuthorize = useCallback(
    () =>
      safe(() => setLoading(true))
        .map(() => redriectMcpOauth(serverId))
        .ifFail((e) => {
          setLoading(false);
          handleErrorWithToast(e);
        })
        .unwrap(),
    [serverId],
  );

  return (
    <div className="w-full">
      <DropdownMenuLabel className="p-2 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("search")}
            className="flex-1 h-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={checked}
            onCheckedChange={(checked) => onClickAllChecked(!!checked)}
          />
          <span className="text-xs font-semibold">{t("allTools")}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div className="max-h-60 overflow-y-auto">
        {filteredTools.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {t("noResults")}
          </div>
        ) : (
          filteredTools.map((tool) => (
            <DropdownMenuItem
              key={tool.name}
              className="flex items-center gap-2 p-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                onToolClick(tool.name, !tool.checked);
              }}
            >
              <Checkbox checked={tool.checked} className="shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate">
                  {tool.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {tool.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </div>
      {isAuthorizing && (
        <>
          <DropdownMenuSeparator />
          <div className="p-2">
            <Button
              className="w-full h-8 text-xs"
              onClick={handleAuthorize}
              disabled={loading}
            >
              {loading ? (
                <Loader className="animate-spin size-3 mr-2" />
              ) : (
                <ShieldAlertIcon className="size-3 mr-2" />
              )}
              {t("authorize")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AppDefaultToolKitSelector() {
  const [appStoreMutate, allowedAppDefaultToolkit] = appStore(
    useShallow((state) => [state.mutate, state.allowedAppDefaultToolkit]),
  );
  const t = useTranslations();
  const toggleAppDefaultToolkit = useCallback(
    (toolkit: AppDefaultToolkit) => {
      appStoreMutate((prev) => {
        const newAllowedAppDefaultToolkit = [
          ...(prev.allowedAppDefaultToolkit ?? []),
        ];
        if (newAllowedAppDefaultToolkit.includes(toolkit)) {
          newAllowedAppDefaultToolkit.splice(
            newAllowedAppDefaultToolkit.indexOf(toolkit),
            1,
          );
        } else {
          newAllowedAppDefaultToolkit.push(toolkit);
        }
        return { allowedAppDefaultToolkit: newAllowedAppDefaultToolkit };
      });
    },
    [appStoreMutate],
  );

  const defaultToolInfo = useMemo(() => {
    const raw = t.raw("Chat.Tool.defaultToolKit");
    return Object.values(AppDefaultToolkit).map((toolkit) => {
      const label = raw[toolkit] || toolkit;
      const id = toolkit;
      let icon = Wrench;
      switch (toolkit) {
        case AppDefaultToolkit.Visualization:
          icon = ChartColumn;
          break;
        case AppDefaultToolkit.WebSearch:
          icon = GlobeIcon;
          break;
        case AppDefaultToolkit.Http:
          icon = HardDriveUploadIcon;
          break;
        case AppDefaultToolkit.Code:
          icon = CodeIcon;
          break;
        case AppDefaultToolkit.Workflow:
          icon = Waypoints;
          break;
        case AppDefaultToolkit.Canvas:
          icon = MousePointer2;
          break;
        case AppDefaultToolkit.Compute:
          icon = Loader;
          break;
        case AppDefaultToolkit.Rag:
          icon = Package;
          break;
      }
      return {
        label,
        id,
        icon,
      };
    });
  }, [t]);

  return (
    <DropdownMenuGroup>
      {defaultToolInfo.map((tool) => {
        const isChecked = !!allowedAppDefaultToolkit?.includes(tool.id);
        return (
          <DefaultToolSwitch
            key={tool.id}
            toolkit={tool.id}
            label={tool.label}
            icon={tool.icon}
            checked={isChecked}
            onToggle={toggleAppDefaultToolkit}
          />
        );
      })}
    </DropdownMenuGroup>
  );
}

function AgentSelector({
  onSelectAgent,
}: {
  onSelectAgent?: (agent: AgentSummary) => void;
}) {
  const t = useTranslations();
  const { myAgents, bookmarkedAgents } = useAgents({
    limit: 50,
  });

  const emptyAgent = useMemo(() => {
    if (myAgents.length + bookmarkedAgents.length > 0) return null;
    return (
      <Link
        href={"/agent/new"}
        className="py-8 px-4 hover:bg-input rounded-lg cursor-pointer flex justify-between items-center text-xs overflow-hidden"
      >
        <div className="gap-1 z-10">
          <div className="flex items-center mb-4 gap-1">
            <p className="font-semibold">{t("Layout.createAgent")}</p>
            <ArrowUpRightIcon className="size-3" />
          </div>
          <p className="text-muted-foreground">
            {bookmarkedAgents.length > 0
              ? t("Layout.createYourOwnAgentOrSelectShared")
              : t("Layout.createYourOwnAgent")}
          </p>
        </div>
      </Link>
    );
  }, [myAgents.length, bookmarkedAgents.length, t]);

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs flex items-center gap-2 font-semibold cursor-pointer">
          <MessageCircle className="size-3.5" />
          {t("Agent.title")}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-80 relative">
            {emptyAgent}

            {/* My Agents */}
            {myAgents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                className="cursor-pointer"
                onClick={() => onSelectAgent?.(agent)}
              >
                {agent.icon && agent.icon.type === "emoji" ? (
                  <div
                    style={{
                      backgroundColor: agent.icon?.style?.backgroundColor,
                    }}
                    className="p-1 rounded flex items-center justify-center ring ring-background border"
                  >
                    <Avatar className="size-3">
                      <AvatarImage src={agent.icon?.value} />
                      <AvatarFallback>{agent.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : null}
                <span className="truncate min-w-0">{agent.name}</span>
              </DropdownMenuItem>
            ))}

            {myAgents.length > 0 && bookmarkedAgents.length > 0 && (
              <DropdownMenuSeparator />
            )}

            {bookmarkedAgents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                className="cursor-pointer"
                onClick={() => onSelectAgent?.(agent)}
              >
                {agent.icon && agent.icon.type === "emoji" ? (
                  <div
                    style={{
                      backgroundColor: agent.icon?.style?.backgroundColor,
                    }}
                    className="p-1 rounded flex items-center justify-center ring ring-background border"
                  >
                    <Avatar className="size-3">
                      <AvatarImage src={agent.icon?.value} />
                      <AvatarFallback>{agent.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : null}
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate min-w-0">{agent.name}</span>
                  {agent.userName && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="size-4 ms-2 shrink-0">
                          <AvatarImage src={agent.userAvatar} />
                          <AvatarFallback className="text-xs text-muted-foreground font-medium">
                            {agent.userName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("Common.sharedBy", { userName: agent.userName })}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}
