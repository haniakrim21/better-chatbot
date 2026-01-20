"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackgroundPaths } from "ui/background-paths";
import { cn } from "lib/utils";
import { motion } from "framer-motion";

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

  const currentTab = getTabValue();

  const tabs = [
    { id: "featured", label: t("Discover.tabs.featured"), href: "/discover" },
    {
      id: "agents",
      label: t("Discover.tabs.agents"),
      href: "/discover/agents",
    },
    { id: "mcp", label: t("Discover.tabs.mcp"), href: "/discover/mcp" },
    { id: "workflows", label: "Workflows", href: "/discover/workflows" },
  ];

  return (
    <div className="relative flex flex-col h-full w-full bg-background/95 overflow-y-auto">
      <div className="absolute inset-x-0 top-0 h-[250px] opacity-20 pointer-events-none z-0">
        <BackgroundPaths />
      </div>

      <div className="container mx-auto px-4 py-8 z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("Discover.title")}
          </h1>
          <p className="text-lg text-muted-foreground w-full max-w-2xl">
            {t("Discover.subtitle")}
          </p>
        </div>

        <div className="w-full relative z-10">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl w-fit border border-border/40 backdrop-blur-sm">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-discover-tab"
                      className="absolute inset-0 bg-background shadow-sm rounded-lg border border-border/50"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 relative z-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}
