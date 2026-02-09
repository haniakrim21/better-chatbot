"use client";

import { Bot, Plug, SearchIcon, Waypoints } from "lucide-react";
import { useState } from "react";
import { Input } from "ui/input";

interface DiscoverSearchProps {
  totalCount: number;
  agentCount: number;
  pluginCount: number;
  workflowCount: number;
}

export function DiscoverSearch({
  totalCount,
  agentCount,
  pluginCount,
  workflowCount,
}: DiscoverSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    // Client-side filtering could be added here
    // For now, this is a visual search bar
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search agents, plugins, and workflows..."
          className="pl-9 h-10 bg-background/50 border-border/50"
        />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">
          {totalCount} available
        </span>
        <span className="flex items-center gap-1">
          <Bot className="size-3" />
          {agentCount} agents
        </span>
        <span className="flex items-center gap-1">
          <Plug className="size-3" />
          {pluginCount} plugins
        </span>
        <span className="flex items-center gap-1">
          <Waypoints className="size-3" />
          {workflowCount} workflows
        </span>
      </div>
    </div>
  );
}
