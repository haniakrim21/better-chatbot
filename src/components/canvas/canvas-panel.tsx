"use client";

import { cn } from "lib/utils";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { appStore } from "@/app/store";
import { Button } from "@/components/ui/button";
import { CanvasEditor } from "./canvas-editor";
import { TerminalPanel, TerminalPanelRef } from "./terminal-panel";

export function CanvasPanel() {
  const { canvas, mutate } = useStore(appStore);
  const [activeTab, setActiveTab] = useState<"editor" | "terminal">("editor");
  const terminalRef = useRef<TerminalPanelRef>(null);

  if (!canvas.isOpen) return null;

  useEffect(() => {
    if (canvas.pendingCommand && terminalRef.current) {
      setActiveTab("terminal");
      const { command, args, cwd, toolCallId } = canvas.pendingCommand;

      // Clear pending command first to prevent re-execution
      mutate({
        canvas: {
          ...canvas,
          pendingCommand: null,
        },
      });

      // Execute and store result in appStore for chat-bot to pick up
      terminalRef.current.executeCommand(command, args, cwd).then((result) => {
        mutate((prev) => ({
          canvas: {
            ...prev.canvas,
            lastCommandResult: {
              command,
              args,
              exitCode: result.exitCode,
              output:
                result.output.length > 5000
                  ? result.output.slice(0, 5000) +
                    "\n...(output truncated for AI context)"
                  : result.output,
              error: result.error,
              toolCallId: toolCallId || "",
            },
          },
        }));
      });
    }
  }, [canvas.pendingCommand, mutate, canvas]);

  const handleClose = () => {
    mutate({
      canvas: {
        ...canvas,
        isOpen: false,
      },
    });
  };

  const handleOpenNewTab = () => {
    window.open(`/canvas?id=${canvas.documentId}`, "_blank");
  };

  return (
    <div className="w-full h-full border-l bg-[#18181b] flex flex-col shadow-xl z-30 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        {/* Left Side - Could be empty or have a subtle mode switcher if absolutely needed,
             but per design it's usually clean. We'll keep the terminal toggle very subtle or
             only show it if there is a pending command. For now, let's keep it minimal. */}
        <div className="flex items-center gap-2">
          {/* We can hide the tab switcher or make it very subtle text links */}
          <button
            onClick={() => setActiveTab("editor")}
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              activeTab === "editor"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Canvas
          </button>
          <span className="text-muted-foreground/30">/</span>
          <button
            onClick={() => setActiveTab("terminal")}
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              activeTab === "terminal"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Terminal
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 text-xs font-medium"
            onClick={() => {
              // Mock Copy action
              navigator.clipboard.writeText(
                canvas.documentId ? "Content copied!" : "",
              );
              // In reality we need to access the editor content.
              // For now let's just show a toast or something if we had it.
            }}
          >
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 text-xs font-medium"
            // Mock Edit action - maybe toggle readOnly?
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 text-xs font-medium"
            // Mock Download action
          >
            Download
          </Button>

          <div className="w-px h-4 bg-border mx-2" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleOpenNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            title="Close canvas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative bg-[#18181b]">
        {/* We use a specific dark bg #18181b to match the screenshot's dark zinc tone */}
        <div
          className={cn(
            "h-full w-full",
            activeTab === "editor" ? "block" : "hidden",
          )}
        >
          <CanvasEditor
            initialContent=""
            readOnly={false}
            key={canvas.documentId || "empty"}
            documentId={canvas.documentId}
          />
        </div>
        <div
          className={cn(
            "h-full w-full",
            activeTab === "terminal" ? "block" : "hidden",
          )}
        >
          <TerminalPanel ref={terminalRef} />
        </div>
      </div>
    </div>
  );
}
