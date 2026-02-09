"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const KeyboardShortcutsPopup = dynamic(
  () =>
    import("@/components/keyboard-shortcuts-popup").then(
      (mod) => mod.KeyboardShortcutsPopup,
    ),
  {
    ssr: false,
  },
);

const ChatPreferencesPopup = dynamic(
  () =>
    import("@/features/chat/components/chat-preferences-popup").then(
      (mod) => mod.ChatPreferencesPopup,
    ),
  {
    ssr: false,
  },
);

const ChatBotVoice = dynamic(
  () =>
    import("@/features/chat/components/chat-bot-voice").then(
      (mod) => mod.ChatBotVoice,
    ),
  {
    ssr: false,
  },
);

const ChatBotTemporary = dynamic(
  () =>
    import("@/features/chat/components/chat-bot-temporary").then(
      (mod) => mod.ChatBotTemporary,
    ),
  {
    ssr: false,
  },
);

const McpCustomizationPopup = dynamic(
  () =>
    import("@/components/mcp-customization-popup").then(
      (mod) => mod.McpCustomizationPopup,
    ),
  {
    ssr: false,
  },
);

const UserSettingsPopup = dynamic(
  () =>
    import("@/components/user/user-detail/user-settings-popup").then(
      (mod) => mod.UserSettingsPopup,
    ),
  {
    ssr: false,
  },
);

const GlobalSearchDialog = dynamic(
  () =>
    import("@/components/global-search-dialog").then(
      (mod) => mod.GlobalSearchDialog,
    ),
  {
    ssr: false,
  },
);

export function AppPopupProvider({
  userSettingsComponent,
}: {
  userSettingsComponent: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <KeyboardShortcutsPopup />
      <ChatPreferencesPopup />
      <UserSettingsPopup userSettingsComponent={userSettingsComponent} />
      <ChatBotVoice />
      <ChatBotTemporary />
      <McpCustomizationPopup />
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
