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
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4",
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

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="border-b p-4 flex justify-between items-center bg-muted/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-bold truncate max-w-[300px]"
            title={title}
          >
            {title}
          </h1>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? "Saving..." : "Saved"}
          <div
            className={`h-2 w-2 rounded-full ${isSaving ? "bg-yellow-500" : "bg-green-500"}`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
