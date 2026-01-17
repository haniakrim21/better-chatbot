"use client";

import { useStore } from "zustand";
import { appStore } from "@/app/store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasPanel } from "@/components/canvas/canvas-panel";

interface ChatCanvasSplitViewProps {
  children: React.ReactNode;
}

export function ChatCanvasSplitView({ children }: ChatCanvasSplitViewProps) {
  const { canvas } = useStore(appStore);

  if (!canvas.isOpen) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {children}
        {/* Render CanvasPanel hidden to keep state/subscriptions alive if needed, 
            but strictly speaking if it returns null when !isOpen, we don't need it.
            However, we want the "transition" effects maybe? 
            For now, hard switching is fine. 
        */}
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize={55} minSize={30}>
        <div className="h-full w-full flex flex-col min-w-0">{children}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={45} minSize={30}>
        <CanvasPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
