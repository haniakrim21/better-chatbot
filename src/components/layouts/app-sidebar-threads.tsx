"use client";

import { SidebarGroupLabel, SidebarMenuSub } from "ui/sidebar";
import Link from "next/link";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubItem,
} from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import { ThreadDropdown } from "@/features/chat/components/thread-dropdown";
import {
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { appStore } from "@/app/store";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  deleteThreadsAction,
  deleteUnarchivedThreadsAction,
} from "@/app/api/chat/actions";
import {
  createFolderAction,
  getFoldersAction,
  deleteFolderAction,
} from "@/app/actions/folder-actions";
import { fetcher } from "lib/utils";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";
import { TextShimmer } from "ui/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { deduplicateByKey, groupBy, cleanThesysTitle } from "lib/utils";
import { ChatThread } from "app-types/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";

type ThreadGroup = {
  label: string;
  threads: any[];
};

const MAX_THREADS_COUNT = 40;

export function AppSidebarThreads() {
  const mounted = useMounted();
  const router = useRouter();
  const t = useTranslations("Layout");
  const [
    storeMutate,
    currentThreadId,
    generatingTitleThreadIds,
    currentTeamId,
  ] = appStore(
    useShallow((state) => [
      state.mutate,
      state.currentThreadId,
      state.generatingTitleThreadIds,
      state.currentTeamId,
    ]),
  );
  // State to track if expanded view is active
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: threadList, isLoading: isThreadsLoading } = useSWR(
    currentTeamId ? `/api/thread?teamId=${currentTeamId}` : "/api/thread",
    fetcher,
    {
      onError: handleErrorWithToast,
      fallbackData: [],
      onSuccess: (data) => {
        storeMutate((prev) => {
          const groupById = groupBy(prev.threadList, "id");

          const generatingTitleThreads = prev.generatingTitleThreadIds
            .map((id) => {
              return groupById[id]?.[0];
            })
            .filter(Boolean) as ChatThread[];
          const list = deduplicateByKey(
            generatingTitleThreads.concat(data),
            "id",
          );
          return {
            threadList: list.map((v) => {
              const target = groupById[v.id]?.[0];
              if (!target) return v;
              if (target.title && !v.title)
                return {
                  ...v,
                  title: target.title,
                };
              return v;
            }),
          };
        });
      },
    },
  );

  const { data: folders, mutate: mutateFolders } = useSWR(
    "folders",
    getFoldersAction,
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderAction(newFolderName);
      mutateFolders();
      setNewFolderName("");
      setShowNewFolderDialog(false);
      toast.success("Folder created");
    } catch (_e) {
      toast.error("Failed to create folder");
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteFolderAction(id);
      if (activeFolderId === id) setActiveFolderId(null);
      mutateFolders();
      // Also mutate threads to refresh folderIds if necessary (though mostly handled by DB cascading deletion or null setting)
      const key = currentTeamId
        ? `/api/thread?teamId=${currentTeamId}`
        : "/api/thread";
      mutate(key);
      toast.success("Folder deleted");
    } catch (_e) {
      toast.error("Failed to delete folder");
    }
  };

  // Check if we have 40 or more threads to display "View All" button
  const hasExcessThreads = threadList && threadList.length >= MAX_THREADS_COUNT;

  // Filter threads based on active folder
  const filteredThreads = useMemo(() => {
    if (!threadList) return [];
    if (activeFolderId) {
      return threadList.filter((t: any) => t.folderId === activeFolderId);
    }
    // If no folder selected, show all threads that actully don't have a folder?
    // Or show *all* threads? Usually "All Chats" shows everything, but "Unsorted" shows no-folder.
    // Let's assume default view is ALL threads for now, or maybe Unsorted.
    // User requirement: "Organize chats into folders".
    // Let's make "All Chats" the default (activeFolderId === null).
    return threadList;
  }, [threadList, activeFolderId]);

  // Use either limited or full thread list based on expanded state
  const displayThreadList = useMemo(() => {
    return !isExpanded && hasExcessThreads && !activeFolderId
      ? filteredThreads.slice(0, MAX_THREADS_COUNT)
      : filteredThreads;
  }, [filteredThreads, hasExcessThreads, isExpanded, activeFolderId]);

  const threadGroupByDate = useMemo(() => {
    if (!displayThreadList || displayThreadList.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: ThreadGroup[] = [
      { label: t("today"), threads: [] },
      { label: t("yesterday"), threads: [] },
      { label: t("lastWeek"), threads: [] },
      { label: t("older"), threads: [] },
    ];

    displayThreadList.forEach((thread) => {
      const threadDate =
        (thread.lastMessageAt
          ? new Date(thread.lastMessageAt)
          : new Date(thread.createdAt)) || new Date();
      threadDate.setHours(0, 0, 0, 0);

      if (threadDate.getTime() === today.getTime()) {
        groups[0].threads.push(thread);
      } else if (threadDate.getTime() === yesterday.getTime()) {
        groups[1].threads.push(thread);
      } else if (threadDate.getTime() >= lastWeek.getTime()) {
        groups[2].threads.push(thread);
      } else {
        groups[3].threads.push(thread);
      }
    });

    // Filter out empty groups
    return groups.filter((group) => group.threads.length > 0);
  }, [displayThreadList]);

  const handleDeleteAllThreads = async () => {
    await toast.promise(deleteThreadsAction(), {
      loading: t("deletingAllChats"),
      success: () => {
        const key = currentTeamId
          ? `/api/thread?teamId=${currentTeamId}`
          : "/api/thread";
        mutate(key);
        router.push("/");
        return t("allChatsDeleted");
      },
      error: t("failedToDeleteAllChats"),
    });
  };

  const handleDeleteUnarchivedThreads = async () => {
    await toast.promise(deleteUnarchivedThreadsAction(), {
      loading: t("deletingUnarchivedChats"),
      success: () => {
        const key = currentTeamId
          ? `/api/thread?teamId=${currentTeamId}`
          : "/api/thread";
        mutate(key);
        router.push("/");
        return t("unarchivedChatsDeleted");
      },
      error: t("failedToDeleteUnarchivedChats"),
    });
  };

  if (isThreadsLoading || threadList?.length === 0)
    return (
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarGroupLabel className="">
                <h4 className="text-xs text-muted-foreground">
                  {t("recentChats")}
                </h4>
              </SidebarGroupLabel>

              {isThreadsLoading ? (
                Array.from({ length: 12 }).map(
                  (_, index) => mounted && <SidebarMenuSkeleton key={index} />,
                )
              ) : (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("noConversationsYet")}
                  </p>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <>
      {/* Folders Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex justify-between items-center group-data-[collapsible=icon]:hidden">
          <span>Folders</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
        </SidebarGroupLabel>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            {/* All Chats Item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeFolderId === null}
                onClick={() => setActiveFolderId(null)}
                className="px-2.5 text-muted-foreground data-[active=true]:text-primary"
              >
                <Folder className="h-4 w-4 mr-2" />
                <span>All Chats</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Render Folders */}
            {folders?.map((folder) => (
              <SidebarMenuItem key={folder.id}>
                <SidebarMenuButton
                  isActive={activeFolderId === folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className="px-2.5 text-muted-foreground data-[active=true]:text-primary group/folder"
                >
                  <span
                    className="h-2 w-2 rounded-full mr-2"
                    style={{ backgroundColor: folder.color || "#888" }}
                  />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover/folder:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteFolder(folder.id, e)}
                  >
                    <Trash className="h-3 w-3 text-destructive" />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Threads Section */}
      {threadGroupByDate.map((group, index) => {
        const isFirst = index === 0;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel className="">
                    <h4 className="text-xs text-muted-foreground group-hover/threads:text-foreground transition-colors">
                      {group.label}
                    </h4>
                    <div className="flex-1" />
                    {isFirst && !activeFolderId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-input! opacity-0 data-[state=open]:opacity-100! group-hover/threads:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteAllThreads}
                          >
                            <Trash />
                            {t("deleteAllChats")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteUnarchivedThreads}
                          >
                            <Trash />
                            {t("deleteUnarchivedChats")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarGroupLabel>

                  {group.threads.map((thread) => (
                    <SidebarMenuSub
                      key={thread.id}
                      className={"group/thread me-0"}
                    >
                      <SidebarMenuSubItem>
                        <ThreadDropdown
                          side="right"
                          threadId={thread.id}
                          beforeTitle={cleanThesysTitle(thread.title)}
                        >
                          <div className="flex items-center data-[state=open]:bg-input! group-hover/thread:bg-input! rounded-lg">
                            <Tooltip delayDuration={1000}>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  asChild
                                  className="group-hover/thread:bg-transparent!"
                                  isActive={currentThreadId === thread.id}
                                >
                                  <Link
                                    href={`/chat/${thread.id}`}
                                    className="flex items-center"
                                  >
                                    {generatingTitleThreadIds.includes(
                                      thread.id,
                                    ) ? (
                                      <TextShimmer className="truncate min-w-0">
                                        {cleanThesysTitle(thread.title) ||
                                          "New Chat"}
                                      </TextShimmer>
                                    ) : (
                                      <p className="truncate min-w-0">
                                        {cleanThesysTitle(thread.title) ||
                                          "New Chat"}
                                      </p>
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] p-4 break-all overflow-y-auto max-h-[200px]">
                                {cleanThesysTitle(thread.title) || "New Chat"}
                              </TooltipContent>
                            </Tooltip>

                            <SidebarMenuAction className="data-[state=open]:bg-input data-[state=open]:opacity-100 opacity-0 group-hover/thread:opacity-100">
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </div>
                        </ThreadDropdown>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}

      {hasExcessThreads && !activeFolderId && (
        <SidebarMenu>
          <SidebarMenuItem>
            {/* TODO: Later implement a dedicated search/all chats page instead of this expand functionality */}
            <div className="w-full flex px-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full hover:bg-input! justify-start"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="me-2" />
                {isExpanded ? t("showLessChats") : t("showAllChats")}
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your chats with folders.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
