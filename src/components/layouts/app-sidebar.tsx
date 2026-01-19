"use client";
import { Sidebar, SidebarContent, SidebarFooter } from "ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarAgents } from "./app-sidebar-agents";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { SidebarHeaderShared } from "./sidebar-header";
import { NabdLogo } from "@/components/logo-animated";

import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { AppSidebarUser } from "./app-sidebar-user";
import { BasicUser } from "app-types/user";
import { TeamSelector } from "@/components/teams/team-selector";
import { CreateGroupModal } from "@/components/chat/create-group-modal";
import { appStore } from "@/app/store";

export function AppSidebar({ user }: { user?: BasicUser }) {
  const userRole = user?.role;
  const router = useRouter();
  const currentTeamId = appStore((state) => state.currentTeamId);
  const mutate = appStore((state) => state.mutate);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Handle new chat shortcut (specific to main app)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.openNewChat)) {
        e.preventDefault();
        router.push("/");
        router.refresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-e border-sidebar-border/80"
    >
      <SidebarHeaderShared
        title={
          <div className="flex items-center gap-3 py-2">
            <NabdLogo size={32} />
            <span className="font-bold text-xl">Nabd</span>
          </div>
        }
        href="/"
        enableShortcuts={true}
        onLinkClick={() => {
          router.push("/");
          router.refresh();
        }}
      >
        <TeamSelector
          value={currentTeamId}
          onChange={(teamId) => {
            mutate({ currentTeamId: teamId });
            router.refresh(); // Refresh threads/data potentially
          }}
          onCreateTeam={() => setCreateGroupOpen(true)}
          currentUserId={user?.id || ""}
        />
      </SidebarHeaderShared>

      <CreateGroupModal
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
      />

      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col overflow-y-auto">
          <AppSidebarMenus />
          <AppSidebarAgents userRole={userRole} />
          <AppSidebarThreads />
        </div>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
