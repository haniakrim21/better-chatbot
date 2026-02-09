"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "ui/badge";
import { Card, CardHeader } from "ui/card";
import { Input } from "ui/input";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

interface ArchiveSearchFilterProps {
  threads: Thread[];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function ArchiveSearchFilter({ threads }: ArchiveSearchFilterProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
    );
  }, [threads, search]);

  return (
    <div className="space-y-3">
      {/* Stats + Search */}
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2.5 py-1"
        >
          <MessageCircle className="h-3 w-3" />
          {threads.length} {threads.length === 1 ? "thread" : "threads"}
        </Badge>
        {threads.length > 3 && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads..."
              className="pl-9 h-8 text-sm bg-background/50"
            />
          </div>
        )}
        {search && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} found
          </span>
        )}
      </div>

      {/* Thread List */}
      {filtered.length === 0 && search ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No threads match &quot;{search}&quot;
        </p>
      ) : (
        filtered.map((thread) => (
          <Link key={thread.id} href={`/chat/${thread.id}`}>
            <Card className="hover:bg-accent/30 transition-all duration-200 cursor-pointer">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base truncate mb-1">
                      {thread.title || "Untitled Chat"}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(
                      new Date(thread.lastMessageAt || thread.createdAt),
                    )}
                  </span>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
