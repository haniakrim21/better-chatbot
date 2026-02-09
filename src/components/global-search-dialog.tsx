"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, SearchIcon, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "ui/dialog";
import { Input } from "ui/input";
import { cn } from "@/lib/utils";

type SearchResult = {
  threadId: string;
  threadTitle: string;
  messageId: string;
  role: string;
  snippet: string;
  createdAt: string;
};

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=20`,
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const navigateToThread = (threadId: string) => {
    router.push(`/chat/${threadId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <div className="flex items-center border-b px-4">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {loading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query && !loading && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          )}
          {!query && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("hint")}
            </div>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.messageId}-${i}`}
              onClick={() => navigateToThread(result.threadId)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0",
                "flex flex-col gap-1",
              )}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{result.threadTitle}</span>
                <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(result.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <User2 className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {result.snippet}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
              Esc
            </kbd>{" "}
            {t("close")}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
              Enter
            </kbd>{" "}
            {t("open")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
