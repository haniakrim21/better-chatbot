"use client";

import { UseChatHelpers } from "@ai-sdk/react";
import { UIMessage } from "ai";
import {
  exportMessageAsDOCX,
  exportMessageAsPDFFromElement,
} from "lib/utils/export-message";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Copy,
  Download,
  FileText,
  GitBranch,
  MoreHorizontal,
  RefreshCw,
  Trash,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  branchFromMessageAction,
  deleteMessageAction,
  deleteMessagesAfterMessageAction,
  deleteMessagesByChatIdAfterTimestampAction,
  updateMessageAction,
} from "@/app/api/chat/actions";
import { useCopy } from "@/hooks/use-copy";

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
  const router = useRouter();

  const getMessageText = (msg: UIMessage) => {
    return (msg.parts || [])
      .map((p: any) => {
        if (p.type === "text") return p.text;
        if (p.type === "tool-invocation") {
          return `\n[Tool: ${p.toolName}]\nInput: ${JSON.stringify(p.args, null, 2)}\n`;
        }
        if (p.type === "tool-result") {
          return `\nSource: ${p.toolName}\nResult: ${typeof p.result === "string" ? p.result : JSON.stringify(p.result, null, 2)}\n`;
        }
        return "";
      })
      .join("\n");
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

  const handleBranch = async () => {
    if (!threadId) {
      toast.error("Cannot branch: no thread context");
      return;
    }
    try {
      const result = await branchFromMessageAction({
        threadId,
        messageId: message.id,
      });
      toast.success(`Branched to "${result.title}"`);
      router.push(`/?threadId=${result.threadId}`);
    } catch (_error) {
      toast.error("Failed to branch conversation");
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

            {threadId && (
              <DropdownMenuItem onClick={handleBranch}>
                <GitBranch className="mr-2 h-4 w-4" />
                Branch from here
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    const promise = exportMessageAsPDFFromElement(
                      `message-${message.id}`,
                      `message-${message.id}.pdf`,
                    );
                    toast.promise(promise, {
                      loading: "Generating professional PDF...",
                      success: "PDF downloaded",
                      error: "Failed to generate PDF",
                    });
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const promise = exportMessageAsDOCX(
                      `message-${message.id}`,
                      `message-${message.id}.docx`,
                    );
                    toast.promise(promise, {
                      loading: "Generating rich DOCX with charts...",
                      success: "DOCX downloaded",
                      error: "Failed to generate DOCX",
                    });
                  }}
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
