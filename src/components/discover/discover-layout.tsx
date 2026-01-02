"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackgroundPaths } from "ui/background-paths";
import { Tabs, TabsList, TabsTrigger } from "ui/tabs";
import { cn } from "lib/utils";

interface DiscoverLayoutProps {
  children: React.ReactNode;
}

export function DiscoverLayout({ children }: DiscoverLayoutProps) {
  const t = useTranslations();
  const pathname = usePathname();

  const getTabValue = () => {
    if (pathname.includes("/discover/agents")) return "agents";
    if (pathname.includes("/discover/mcp")) return "mcp";
    if (pathname.includes("/discover/workflows")) return "workflows";

    if (pathname.includes("/discover/models")) return "models";
    return "featured";
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-background/95">
      <div className="absolute inset-x-0 top-0 h-[250px] opacity-20 pointer-events-none z-0">
        <BackgroundPaths />
      </div>

      <div className="container mx-auto px-4 py-8 z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("Discover.title")}
          </h1>
          <p className="text-lg text-muted-foreground w-full max-w-2xl">
            {t("Discover.subtitle")}
          </p>
        </div>

        <Tabs value={getTabValue()} className="w-full relative z-10">
          <TabsList className="bg-transparent p-0 h-auto gap-4">
            <TabsTrigger
              value="featured"
              asChild
              className={cn(
                "px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 text-lg hover:text-foreground/80",
              )}
            >
              <Link href="/discover" className="cursor-pointer">
                {t("Discover.tabs.featured")}
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="agents"
              asChild
              className={cn(
                "px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 text-lg hover:text-foreground/80",
              )}
            >
              <Link href="/discover/agents" className="cursor-pointer">
                {t("Discover.tabs.agents")}
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="mcp"
              asChild
              className={cn(
                "px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 text-lg hover:text-foreground/80",
              )}
            >
              <Link href="/discover/mcp" className="cursor-pointer">
                {t("Discover.tabs.mcp")}
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="workflows"
              asChild
              className={cn(
                "px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 text-lg hover:text-foreground/80",
              )}
            >
              <Link href="/discover/workflows" className="cursor-pointer">
                Workflows
              </Link>
            </TabsTrigger>

            {/* Future Models Tab */}
            {/* <Link href="/discover/models">
                 <TabsTrigger value="models">{t("Discover.Tabs.Models")}</TabsTrigger>
             </Link> */}
          </TabsList>
        </Tabs>

        <div className="mt-4 relative z-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}
