"use client";

import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Copy,
  MoreHorizontal,
  RefreshCw,
  Trash,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "ui/dropdown-menu";
import { Button } from "ui/button";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { toast } from "sonner";
import {
  deleteMessageAction,
  deleteMessagesByChatIdAfterTimestampAction,
  deleteMessagesAfterMessageAction,
  updateMessageAction,
} from "@/app/api/chat/actions";
import { useCopy } from "@/hooks/use-copy";
import {
  exportMessageAsPDF,
  exportMessageAsDOCX,
} from "lib/utils/export-message";
import { Download, FileText } from "lucide-react";

interface MessageActionsMenuProps {
  message: UIMessage;
  setMessages: UseChatHelpers<UIMessage>["setMessages"];
  onEdit?: () => void;
  isReadOnly?: boolean;
  threadId?: string;
}

export function MessageActionsMenu({
  message,
  setMessages,
  onEdit,
  isReadOnly,
  threadId,
}: MessageActionsMenuProps) {
  const t = useTranslations();
  const { copy } = useCopy();

  const getMessageText = (msg: UIMessage) => {
    return (msg.parts || [])
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("");
  };

  const handleRoleChange = async (newRole: "user" | "assistant" | "system") => {
    // Optimistic update
    const updatedMessage = { ...message, role: newRole };
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? updatedMessage : m)),
    );

    // Persist to DB
    try {
      if (threadId) {
        // If threadId exists, we can upsert safely even if it doesn't exist yet (created via Insert)
        await updateMessageAction(updatedMessage, threadId);
      } else {
        // Fallback to update (might fail if new message not in DB yet)
        await updateMessageAction(updatedMessage);
      }
      toast.success("Role updated");
    } catch (_error) {
      toast.error("Failed to update role");
      // Revert logic could be added here
    }
  };

  const handleInsert = async (direction: "above" | "below") => {
    // Branching Logic:
    // 1. "Above": Delete current message and everything forward. Replace with new message.
    // 2. "Below": Delete everything AFTER current message. Append new message.

    // Server cleanup
    try {
      if (threadId) {
        if (direction === "above") {
          await deleteMessagesByChatIdAfterTimestampAction(message.id);
        } else {
          await deleteMessagesAfterMessageAction(message.id);
        }
      }
    } catch (e) {
      console.error("Failed to cleanup messages during insert", e);
      toast.error("Failed to prepare branch");
      return;
    }

    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === message.id);
      if (index === -1) return prev;

      const newMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: "" }],
      } as any;

      if (direction === "above") {
        return [...prev.slice(0, index), newMessage];
      } else {
        return [...prev.slice(0, index + 1), newMessage];
      }
    });
  };

  const handleDelete = async () => {
    // Optimistic update
    setMessages((prev) => prev.filter((m) => m.id !== message.id));

    // Server delete
    try {
      await deleteMessageAction(message.id);
    } catch (_error) {
      toast.error("Failed to delete message");
      // Revert if needed, but for now we assume optimistic is enough or we rely on SWR revalidation elsewhere if connected
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild data-testid="message-actions-menu-trigger">
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => copy(getMessageText(message))}>
          <Copy className="mr-2 h-4 w-4" />
          {t("Common.copy")}
        </DropdownMenuItem>

        {!isReadOnly && (
          <>
            <DropdownMenuSeparator />

            {/* {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                {t("Common.edit")}
              </DropdownMenuItem>
            )} */}

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  disabled={message.role === "user"}
                  onClick={() => handleRoleChange("user")}
                >
                  <User className="mr-2 h-4 w-4" />
                  User
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={message.role === "assistant"}
                  onClick={() => handleRoleChange("assistant")}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Assistant
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleInsert("above")}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Insert Above
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleInsert("below")}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Insert Below
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() =>
                    exportMessageAsPDF(
                      getMessageText(message),
                      `message-${message.id}.pdf`,
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    exportMessageAsDOCX(
                      getMessageText(message),
                      `message-${message.id}.docx`,
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  DOCX
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              {t("Common.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
