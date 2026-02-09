"use client";

import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical, Trash } from "lucide-react";
import { deleteDocument } from "@/lib/knowledge/actions";
import { toast } from "sonner"; // Assuming sonner is used based on previous files (edit-agent.tsx used it)
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface DocumentActionsProps {
  documentId: string;
  knowledgeBaseId: string;
  documentName: string;
}

export function DocumentActions({
  documentId,
  knowledgeBaseId,
  documentName,
}: DocumentActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) return;

    setIsLoading(true);
    try {
      await deleteDocument(documentId, knowledgeBaseId);
      toast.success("Document deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash className="mr-2 h-4 w-4" />
          )}
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
