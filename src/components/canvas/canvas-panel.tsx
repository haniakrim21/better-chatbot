"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "zustand";
import { appStore } from "@/app/store";
import { CanvasEditor } from "./canvas-editor";
import { TerminalPanel, TerminalPanelRef } from "./terminal-panel";
import {
  X,
  ExternalLink,
  FileText,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "lib/utils";

export function CanvasPanel() {
  const { canvas, mutate } = useStore(appStore);
  const [activeTab, setActiveTab] = useState<"editor" | "terminal">("editor");
  const terminalRef = useRef<TerminalPanelRef>(null);

  if (!canvas.isOpen) return null;

  useEffect(() => {
    if (canvas.pendingCommand && terminalRef.current) {
      setActiveTab("terminal");
      const { command, args, cwd } = canvas.pendingCommand;
      terminalRef.current.executeCommand(command, args, cwd);

      // Clear pending command
      mutate({
        canvas: {
          ...canvas,
          pendingCommand: null,
        },
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
    <div className="w-full h-full border-l bg-background flex flex-col shadow-xl z-30 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "editor" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("editor")}
            className="h-7 text-xs gap-1"
          >
            <FileText className="size-3" />
            Editor
          </Button>
          <Button
            variant={activeTab === "terminal" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("terminal")}
            className="h-7 text-xs gap-1"
          >
            <TerminalIcon className="size-3" />
            Terminal
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
            title="Close canvas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
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
