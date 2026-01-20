"use client";
import { useState, useMemo } from "react";
import {
  MCPServerConfig,
  MCPRemoteConfigZodSchema,
  MCPStdioConfigZodSchema,
} from "app-types/mcp";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import JsonView from "./ui/json-view";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { useRouter } from "next/navigation";
import { createDebounce, fetcher, isNull, safeJSONParse } from "lib/utils";
import { handleErrorWithToast } from "ui/shared-toast";
import { mutate } from "swr";
import { Loader, LinkIcon } from "lucide-react";
import {
  isMaybeMCPServerConfig,
  isMaybeRemoteConfig,
} from "lib/ai/mcp/is-mcp-config";

import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { TeamSelect } from "./team-select";
import {
  existMcpClientByServerNameAction,
  resolveMcpConfigAction,
} from "@/app/api/mcp/actions";

interface MCPEditorProps {
  initialConfig?: MCPServerConfig;
  name?: string;
  id?: string;
  teamId?: string | null;
}

const STDIO_ARGS_ENV_PLACEHOLDER = `/** STDIO Example */
{
  "command": "node", 
  "args": ["index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-...",
  }
}

/** SSE,Streamable HTTP Example */
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}`;

export default function MCPEditor({
  initialConfig,
  name: initialName,
  id,
  teamId: initialTeamId,
}: MCPEditorProps) {
  const t = useTranslations();
  const shouldInsert = useMemo(() => isNull(id), [id]);

  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const errorDebounce = useMemo(() => createDebounce(), []);

  // State for form fields
  const [name, setName] = useState<string>(initialName ?? "");
  const [teamId, setTeamId] = useState<string | null>(initialTeamId || null);
  const router = useRouter();
  const [config, setConfig] = useState<MCPServerConfig>(
    initialConfig as MCPServerConfig,
  );
  const [jsonString, setJsonString] = useState<string>(
    initialConfig ? JSON.stringify(initialConfig, null, 2) : "",
  );

  // Name validation schema
  const nameSchema = z.string().regex(/^[a-zA-Z0-9\-]+$/, {
    message: t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens"),
  });

  const validateName = (nameValue: string): boolean => {
    const result = nameSchema.safeParse(nameValue);
    if (!result.success) {
      setNameError(
        t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens"),
      );
      return false;
    }
    setNameError(null);
    return true;
  };

  const saveDisabled = useMemo(() => {
    return (
      name.trim() === "" ||
      isLoading ||
      !!jsonError ||
      !!nameError ||
      !isMaybeMCPServerConfig(config)
    );
  }, [isLoading, jsonError, nameError, config, name]);

  // Validate
  const validateConfig = (jsonConfig: unknown): boolean => {
    const result = isMaybeRemoteConfig(jsonConfig)
      ? MCPRemoteConfigZodSchema.safeParse(jsonConfig)
      : MCPStdioConfigZodSchema.safeParse(jsonConfig);

    if (JSON.stringify(jsonConfig).includes("${input:")) {
      handleErrorWithToast(
        new Error(
          t("MCP.inputVariablesNotSupported") ||
            "Input variables (e.g. ${input:...}) are not supported. Please replace them with actual values.",
        ),
        "mcp-editor-error",
      );
      return false;
    }

    if (!result.success) {
      handleErrorWithToast(result.error, "mcp-editor-error");
    }
    return result.success;
  };

  // Handle save button click
  const handleSave = async () => {
    // Perform validation
    if (!validateConfig(config)) return;
    if (!name) {
      return handleErrorWithToast(
        new Error(t("MCP.nameIsRequired")),
        "mcp-editor-error",
      );
    }

    if (!validateName(name)) {
      return handleErrorWithToast(
        new Error(t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens")),
        "mcp-editor-error",
      );
    }

    safe(() => setIsLoading(true))
      .map(async () => {
        if (shouldInsert) {
          const exist = await existMcpClientByServerNameAction(name);
          if (exist) {
            throw new Error(t("MCP.nameAlreadyExists"));
          }
        }
      })
      .map(() =>
        fetcher("/api/mcp", {
          method: "POST",
          body: JSON.stringify({
            name,
            config,
            id,
            teamId,
          }),
        }),
      )
      .ifOk(() => {
        toast.success(t("MCP.configurationSavedSuccessfully"));
        mutate("/api/mcp/list");
        router.push("/mcp");
      })
      .ifFail(handleErrorWithToast)
      .watch(() => setIsLoading(false));
  };

  const handleAutoFill = async (url: string) => {
    if (!url.trim()) return;

    setIsResolvingUrl(true);
    try {
      const result = await resolveMcpConfigAction(url.trim());
      if (result.success && result.data) {
        const { name: resolvedName, config: resolvedConfig } = result.data;

        toast.success(t("MCP.detectedSmitheryLink"), {
          description: `Auto-configured for ${resolvedName}`,
        });

        setConfig(resolvedConfig as MCPServerConfig);
        setJsonString(JSON.stringify(resolvedConfig, null, 2));

        if (!name) {
          setName(resolvedName);
        }
        setJsonError(null);
      }
    } catch (e) {
      console.error("Failed to resolve MCP config from URL", e);
    } finally {
      setIsResolvingUrl(false);
    }
  };

  const handleConfigChange = async (data: string) => {
    setJsonString(data);

    // Check for Smithery URL
    if (
      data.trim().startsWith("http") &&
      (data.includes("smithery.ai") || data.includes("github.com"))
    ) {
      setIsResolvingUrl(true);
      try {
        const result = await resolveMcpConfigAction(data.trim());
        if (result.success && result.data) {
          const { name: resolvedName, config: resolvedConfig } = result.data;

          toast.success(t("MCP.detectedSmitheryLink"), {
            description: `Auto-configured for ${resolvedName}`,
          });

          setConfig(resolvedConfig as MCPServerConfig);
          setJsonString(JSON.stringify(resolvedConfig, null, 2));

          if (!name) {
            setName(resolvedName);
          }
          setJsonError(null);
          return;
        }
      } catch (e) {
        console.error("Failed to resolve MCP config from URL", e);
      } finally {
        setIsResolvingUrl(false);
      }
    }

    // Check for Smithery command paste
    if (data.trim().startsWith("npx -y @smithery/cli run")) {
      const SMITH_REGEX = /npx\s+-y\s+@smithery\/cli\s+run\s+([^\s]+)(.*)/;
      const match = data.trim().match(SMITH_REGEX);
      if (match) {
        const [_, packageName, argsStr] = match;
        // Extract args, handling potential quotes if needed (simple split for now)
        const extraArgs = argsStr.trim().split(/\s+/).filter(Boolean);

        const newConfig: MCPServerConfig = {
          command: "npx",
          args: ["-y", "@smithery/cli", "run", packageName, ...extraArgs],
        };

        toast.info(t("MCP.detectedSmitheryCommand"), {
          description: "Converted to MCP Stdio config automatically.",
        });

        setConfig(newConfig);
        setJsonString(JSON.stringify(newConfig, null, 2));

        // Auto-fill name if empty
        if (!name && packageName) {
          const derivedName =
            packageName
              .split("/")
              .pop()
              ?.replace(/[^a-zA-Z0-9-]/g, "-") || "";
          if (derivedName) setName(derivedName);
        }

        setJsonError(null);
        return;
      }
    }

    const result = safeJSONParse(data);
    errorDebounce.clear();
    if (result.success) {
      setConfig(result.value as MCPServerConfig);
      setJsonError(null);
    } else if (data.trim() !== "") {
      errorDebounce(() => {
        setJsonError(
          (result.error as Error)?.message ??
            JSON.stringify(result.error, null, 2),
        );
      }, 1000);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-6">
        {/* Auto-fill field */}
        {!id && (
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-dashed border-primary/20">
            <Label
              htmlFor="auto-fill"
              className="text-primary font-semibold flex items-center gap-2"
            >
              <LinkIcon className="size-4" />
              {t("MCP.autoFillFromLink")}
            </Label>
            <div className="relative">
              <Input
                id="auto-fill"
                placeholder={t("MCP.pasteSmitheryLinkPlaceholder")}
                onChange={(e) => handleAutoFill(e.target.value)}
                className="bg-background pr-10"
              />
              {isResolvingUrl && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="size-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>

          <Input
            id="name"
            value={name}
            disabled={!shouldInsert}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value) validateName(e.target.value);
            }}
            placeholder={t("MCP.enterMcpServerName")}
            className={nameError ? "border-destructive" : ""}
          />
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config">Config</Label>
          </div>

          {/* Split view for config editor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left side: Textarea for editing */}
            <div className="space-y-2">
              <Textarea
                id="config-editor"
                value={jsonString}
                onChange={(e) => handleConfigChange(e.target.value)}
                data-testid="mcp-config-editor"
                className="font-mono h-[40vh] resize-none overflow-y-auto"
                placeholder={STDIO_ARGS_ENV_PLACEHOLDER}
              />
              <p className="text-xs text-muted-foreground">
                {t.rich("MCP.pasteSmitheryCommandTip", {
                  link: (chunks) => (
                    <a
                      href="https://smithery.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      {chunks}
                    </a>
                  ),
                  code: (chunks) => <code>{chunks}</code>,
                })}
              </p>
            </div>

            {/* Right side: JSON view */}
            <div className="space-y-2 hidden sm:block">
              <div className="border border-input rounded-md p-4 h-[40vh] overflow-auto relative bg-secondary">
                <Label
                  htmlFor="config-view"
                  className="text-xs text-muted-foreground mb-2"
                >
                  preview
                </Label>
                {isResolvingUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader className="size-6 animate-spin text-primary" />
                  </div>
                )}
                <JsonView
                  data={config}
                  initialExpandDepth={3}
                  data-testid="mcp-config-view"
                />
                {jsonError && jsonString && (
                  <div className="absolute w-full bottom-0 right-0 px-2 pb-2 animate-in fade-in-0 duration-300">
                    <Alert variant="destructive" className="border-destructive">
                      <AlertTitle className="text-xs font-semibold">
                        Parsing Error
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        {jsonError}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            {t("Team.selectTeam")}
            <span className="text-xs text-muted-foreground">
              {t("Common.optional")}
            </span>
          </Label>
          <TeamSelect value={teamId} onChange={setTeamId} />
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" disabled={saveDisabled}>
          {isLoading ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <span className="font-bold">{t("MCP.saveConfiguration")}</span>
          )}
        </Button>
      </div>
    </>
  );
}
