"use client";

import { ChatExportSummary } from "app-types/chat-export";
import { MCPServerInfo } from "app-types/mcp";
import { UserPreferences } from "app-types/user";
import { authClient } from "auth/client";
import { formatDistanceToNow } from "date-fns";
import { notify } from "lib/notify";
import { fetcher } from "lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  LinkIcon,
  Loader,
  Share2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { safe } from "ts-safe";
import { Button } from "ui/button";
import { ExamplePlaceholder } from "ui/example-placeholder";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Skeleton } from "ui/skeleton";
import { Textarea } from "ui/textarea";
import { McpServerCustomizationContent } from "@/components/mcp-customization-popup";
import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { useObjectState } from "@/hooks/use-object-state";

export function UserInstructionsContent() {
  const t = useTranslations();

  const responseStyleExamples = useMemo(
    () => [
      t("Chat.ChatPreferences.responseStyleExample1"),
      t("Chat.ChatPreferences.responseStyleExample2"),
      t("Chat.ChatPreferences.responseStyleExample3"),
      t("Chat.ChatPreferences.responseStyleExample4"),
    ],
    [],
  );

  const professionExamples = useMemo(
    () => [
      t("Chat.ChatPreferences.professionExample1"),
      t("Chat.ChatPreferences.professionExample2"),
      t("Chat.ChatPreferences.professionExample3"),
      t("Chat.ChatPreferences.professionExample4"),
      t("Chat.ChatPreferences.professionExample5"),
    ],
    [],
  );

  const { data: session } = authClient.useSession();

  const [preferences, setPreferences] = useObjectState<UserPreferences>({
    displayName: "",
    responseStyleExample: "",
    profession: "",
    botName: "",
  });

  const {
    data,
    mutate: fetchPreferences,
    isLoading,
    isValidating,
  } = useSWR<UserPreferences>("/api/user/preferences", fetcher, {
    fallback: {},
    dedupingInterval: 0,
    onSuccess: (data) => {
      setPreferences(data);
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const savePreferences = async () => {
    safe(() => setIsSaving(true))
      .ifOk(() =>
        fetch("/api/user/preferences", {
          method: "PUT",
          body: JSON.stringify(preferences),
        }),
      )
      .ifOk(() => fetchPreferences())
      .watch((result) => {
        if (result.isOk)
          toast.success(t("Chat.ChatPreferences.preferencesSaved"));
        else toast.error(t("Chat.ChatPreferences.failedToSavePreferences"));
      })
      .watch(() => setIsSaving(false));
  };

  const isDiff = useMemo(() => {
    if ((data?.displayName || "") !== (preferences.displayName || ""))
      return true;
    if ((data?.profession || "") !== (preferences.profession || ""))
      return true;
    if (
      (data?.responseStyleExample || "") !==
      (preferences.responseStyleExample || "")
    )
      return true;
    if ((data?.botName || "") !== (preferences.botName || "")) return true;
    return false;
  }, [preferences, data]);

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.userInstructions")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.userInstructionsDescription")}
      </p>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <Label>{t("Chat.ChatPreferences.whatShouldWeCallYou")}</Label>
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <Input
              placeholder={session?.user.name || ""}
              value={preferences.displayName}
              onChange={(e) => {
                setPreferences({
                  displayName: e.target.value,
                });
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("Chat.ChatPreferences.botName")}</Label>
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <Input
              placeholder="NabdGPT"
              value={preferences.botName}
              onChange={(e) => {
                setPreferences({
                  botName: e.target.value,
                });
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 text-foreground flex-1">
          <Label>{t("Chat.ChatPreferences.whatBestDescribesYourWork")}</Label>
          <div className="relative w-full">
            {isLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <>
                <Input
                  value={preferences.profession}
                  onChange={(e) => {
                    setPreferences({
                      profession: e.target.value,
                    });
                  }}
                />
                {(preferences.profession?.length ?? 0) === 0 && (
                  <div className="absolute left-0 top-0 w-full h-full py-2 px-4 pointer-events-none">
                    <ExamplePlaceholder placeholder={professionExamples} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-foreground">
          <Label>
            {t(
              "Chat.ChatPreferences.whatPersonalPreferencesShouldBeTakenIntoAccountInResponses",
            )}
          </Label>
          <span className="text-xs text-muted-foreground"></span>
          <div className="relative w-full">
            {isLoading ? (
              <Skeleton className="h-60" />
            ) : (
              <>
                <Textarea
                  className="h-60 resize-none"
                  value={preferences.responseStyleExample}
                  onChange={(e) => {
                    setPreferences({
                      responseStyleExample: e.target.value,
                    });
                  }}
                />
                {(preferences.responseStyleExample?.length ?? 0) === 0 && (
                  <div className="absolute left-0 top-0 w-full h-full py-2 px-4 pointer-events-none">
                    <ExamplePlaceholder placeholder={responseStyleExamples} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {isDiff && !isValidating && (
        <div className="flex pt-4 items-center justify-end fade-in animate-in duration-300">
          <Button variant="ghost">{t("Common.cancel")}</Button>
          <Button disabled={isSaving || isLoading} onClick={savePreferences}>
            {t("Common.save")}
            {isSaving && <Loader className="size-4 ms-2 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MCPInstructionsContent() {
  const t = useTranslations("");
  const [search, setSearch] = useState("");
  const [mcpServer, setMcpServer] = useState<
    (MCPServerInfo & { id: string }) | null
  >(null);

  const { isLoading, data: mcpList } = useMcpList();

  if (mcpServer) {
    return (
      <McpServerCustomizationContent
        title={
          <div className="flex flex-col">
            <button
              onClick={() => setMcpServer(null)}
              className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="size-3" />
              {t("Common.back")}
            </button>
            {mcpServer.name}
          </div>
        }
        mcpServerInfo={mcpServer}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.mcpInstructions")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.mcpInstructionsDescription")}
      </p>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2 text-foreground flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder={t("Common.search")}
          />
        </div>
        <div className="flex flex-col gap-2 text-foreground flex-1">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))
          ) : mcpList?.length === 0 ? (
            <div className="flex flex-col gap-2 text-foreground flex-1">
              <p className="text-center py-8 text-muted-foreground">
                {t("MCP.configureYourMcpServerConnectionSettings")}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {mcpList?.map((mcp) => (
                <Button
                  onClick={() => setMcpServer({ ...mcp, id: mcp.id })}
                  variant={"outline"}
                  size={"lg"}
                  key={mcp.id}
                >
                  <p>{mcp.name}</p>
                  {mcp.error ? (
                    <AlertCircle className="size-3.5 text-destructive" />
                  ) : mcp.status == "loading" ? (
                    <Loader className="size-3.5 animate-spin" />
                  ) : null}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExportsManagementContent() {
  const t = useTranslations();

  const {
    data: exports,
    mutate: refetchExports,
    isLoading,
  } = useSWR<ChatExportSummary[]>("/api/export", fetcher);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (exportId: string) => {
    const answer = await notify.confirm({
      description: t("Chat.ChatPreferences.confirmDeleteExport"),
    });
    if (!answer) {
      return;
    }

    try {
      setDeletingId(exportId);
      const response = await fetch(`/api/export/${exportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete export");
      }

      toast.success(t("Chat.ChatPreferences.exportDeleted"));
      refetchExports();
    } catch (_error) {
      toast.error(t("Chat.ChatPreferences.failedToDeleteExport"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (exportId: string) => {
    const link = `${window.location.origin}/export/${exportId}`;
    navigator.clipboard.writeText(link);
    toast.success(t("Chat.ChatPreferences.linkCopied"));
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.myExports")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.myExportsDescription")}
      </p>

      <div className="flex flex-col gap-4 w-full">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))
        ) : !exports || exports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="size-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {t("Chat.ChatPreferences.noExportsYet")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("Chat.ChatPreferences.exportHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map((exportItem) => (
              <div
                key={exportItem.id}
                onClick={() => {
                  window.open(`/export/${exportItem.id}`, "_blank");
                }}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{exportItem.title}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-sm text-muted-foreground">
                      <span>
                        {t("Chat.ChatPreferences.exported")}{" "}
                        {formatDistanceToNow(new Date(exportItem.exportedAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {exportItem.expiresAt && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {t("Chat.ChatPreferences.expires")}{" "}
                            {formatDistanceToNow(
                              new Date(exportItem.expiresAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                        </>
                      )}
                      {exportItem.commentCount > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {exportItem.commentCount}{" "}
                            {t("Chat.ChatPreferences.comments")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyLink(exportItem.id);
                      }}
                      title={t("Chat.ChatPreferences.copyLink")}
                    >
                      <LinkIcon className="size-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(exportItem.id);
                      }}
                      disabled={deletingId === exportItem.id}
                      title={t("Common.delete")}
                    >
                      {deletingId === exportItem.id ? (
                        <Loader className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 hover:text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type UserMemory = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
};

export function MemoryManagementContent() {
  const t = useTranslations("Chat.ChatPreferences");
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setMemories(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/memory/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      toast.success(t("memoryDeleted"));
    } catch {
      toast.error(t("failedToDeleteMemory"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await fetch("/api/memory", { method: "DELETE" });
      setMemories([]);
      toast.success(t("allMemoriesDeleted"));
    } catch {
      toast.error(t("failedToDeleteMemory"));
    } finally {
      setDeletingAll(false);
    }
  };

  const categoryColors: Record<string, string> = {
    preference: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    fact: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    project:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    style:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="size-5" />
          {t("memory")}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          {t("memoryDescription")}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="text-muted-foreground text-center py-8 text-sm">
          {t("noMemories")}
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll && <Loader className="mr-2 size-4 animate-spin" />}
              {t("deleteAllMemories")}
            </Button>
          </div>
          <div className="space-y-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{memory.content}</p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${categoryColors[memory.category] || categoryColors.general}`}
                  >
                    {memory.category}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                >
                  {deletingId === memory.id ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4 hover:text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
