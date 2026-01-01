"use client";

import { useKnowledgeBases } from "@/hooks/queries/use-knowledge-bases";
import { BookOpen, Check } from "lucide-react";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useParams } from "next/navigation";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "ui/dropdown-menu";
import Link from "next/link";
import { DropdownMenuSeparator } from "ui/dropdown-menu";
import { Plus } from "lucide-react";

export function KnowledgeBaseSelector({
  onSelectKB,
}: {
  onSelectKB?: (id: string) => void;
}) {
  const { knowledgeBases, isLoading } = useKnowledgeBases();
  const params = useParams();

  const threadId = params?.id as string | undefined;

  const [threadKnowledgeBase] = appStore(
    useShallow((state) => [state.threadKnowledgeBase]),
  );
  const currentKBId = threadId ? threadKnowledgeBase[threadId] : undefined;

  // if (isLoading) return null; // Let's show it even if loading, or handle loading inside.

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs flex items-center gap-2 font-semibold cursor-pointer">
          <BookOpen className="size-3.5" />
          <span>Knowledge Base</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-80 relative">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onSelectKB?.("")}
            >
              <div className="flex items-center justify-between flex-1">
                <span>None</span>
                {!currentKBId && <Check className="size-4" />}
              </div>
            </DropdownMenuItem>

            {knowledgeBases.length > 0 && (
              <>
                {knowledgeBases.map((kb) => (
                  <DropdownMenuItem
                    key={kb.id}
                    className="cursor-pointer"
                    onClick={() => onSelectKB?.(kb.id)}
                  >
                    <div className="flex items-center justify-between flex-1">
                      <span className="truncate">{kb.name}</span>
                      {currentKBId === kb.id && <Check className="size-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {knowledgeBases.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-4 text-xs text-muted-foreground">
                <span>No Knowledge Bases found</span>
              </div>
            )}

            <div className="py-1">
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem asChild>
              <Link
                href="/knowledge"
                className="cursor-pointer flex items-center gap-2"
              >
                <Plus className="size-3.5" />
                <span>Manage Knowledge</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}
