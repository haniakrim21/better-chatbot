"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "zustand";
import { appStore } from "@/app/store";
import {
  getCanvasDocumentAction,
  saveCanvasDocumentAction,
} from "@/app/api/canvas/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CanvasEditorProps {
  initialContent?: string;
  readOnly?: boolean;
  documentId?: string | null;
}

export function CanvasEditor({
  initialContent = "",
  readOnly = false,
  documentId: propDocumentId,
}: CanvasEditorProps) {
  const searchParams = useSearchParams();
  const documentId = propDocumentId || searchParams.get("id");
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState("Untitled");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch document
  useEffect(() => {
    if (documentId) {
      setIsLoading(true);
      getCanvasDocumentAction(documentId)
        .then((doc) => {
          if (doc) {
            setContent(doc.content || "");
            setTitle(doc.title);
            if (editor && doc.content && editor.getHTML() !== doc.content) {
              editor.commands.setContent(doc.content);
            }
          }
        })
        .catch((err) => toast.error("Failed to load document"))
        .finally(() => setIsLoading(false));
    }
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveData = useCallback(
    async (newContent: string) => {
      if (!documentId) return;
      setIsSaving(true);
      try {
        await saveCanvasDocumentAction({
          id: documentId,
          title, // Should also allow updating title
          content: newContent,
        });
      } catch (_error) {
        toast.error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [documentId, title],
  );

  const debouncedSave = useDebounce(saveData, 1000);

  const { canvas, mutate } = useStore(appStore);

  // Sync selection to store
  const handleSelectionUpdate = useCallback(
    (editorInstance: any) => {
      const { from, to, empty } = editorInstance.state.selection;
      if (empty) {
        if (canvas.currentSelection) {
          // Only update if it changed
          mutate({
            canvas: { ...canvas, currentSelection: null },
          });
        }
      } else {
        const text = editorInstance.state.doc.textBetween(from, to, " ");
        if (text !== canvas.currentSelection) {
          mutate({
            canvas: { ...canvas, currentSelection: text },
          });
        }
      }
    },
    [canvas, mutate],
  );

  const debouncedSelectionUpdate = useDebounce(handleSelectionUpdate, 500);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something amazing...",
      }),
      Image,
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-zinc max-w-3xl mx-auto focus:outline-none min-h-[500px]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      debouncedSave(html);
    },
    onSelectionUpdate: ({ editor }) => {
      // We debounce to avoid flooding store on cursor movement
      debouncedSelectionUpdate(editor);
    },
  });

  // Handle pending AI edits
  useEffect(() => {
    if (editor && canvas.pendingEdit && canvas.isOpen) {
      const { replacement, instruction } = canvas.pendingEdit;
      if (replacement) {
        editor.commands.insertContent(replacement);
        toast.success(`Applied: ${instruction}`);
      }

      // Clear the pending edit so it doesn't re-trigger
      mutate({
        canvas: { ...canvas, pendingEdit: null },
      });
    }
  }, [canvas.pendingEdit, editor, mutate, canvas.isOpen]);

  // Sync content if loaded *after* editor init
  useEffect(() => {
    if (
      editor &&
      content &&
      editor.getHTML() !== content &&
      !editor.isFocused
    ) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  // Calculate word count for stats, maybe?
  const wordCount = editor.storage.characterCount?.words?.() || 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#18181b] text-zinc-100 relative group">
      {/* Title Area - Floating or Top */}
      <div className="px-12 pt-8 pb-4 shrink-0 mx-auto w-full max-w-3xl">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent text-3xl font-bold text-zinc-100 placeholder:text-zinc-600 focus:outline-none w-full"
          placeholder="Untitled"
        />
        <div className="flex items-center gap-2 mt-2">
          {/* Subtitle / Metadata placeholder */}
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Marketing Plan
          </div>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
          )}
          <div className="text-xs text-zinc-600">
            {isSaving ? "Saving..." : "Saved"}
          </div>
          <span className="text-zinc-700">•</span>
          <div className="text-xs text-zinc-600">{wordCount} words</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <EditorContent editor={editor} className="min-h-full py-4" />
      </div>

      {/* Floating Action Bar - Bottom Right */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 p-2 rounded-lg shadow-lg border border-zinc-700/50 transition-colors"
          title="Ask AI to Edit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-sparkles"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </button>
        <button
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 p-2 rounded-lg shadow-lg border border-zinc-700/50 transition-colors"
          title="Add Comment"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-message-square-plus"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" x2="15" y1="10" y2="10" />
            <line x1="12" x2="12" y1="7" y2="13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
