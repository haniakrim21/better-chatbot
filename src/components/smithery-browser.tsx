"use client";

import { useState } from "react";
import { featuredSmitheryMcps, SmitheryMVP } from "@/data/smithery";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { toast } from "sonner";
import { saveMcpClientAction } from "@/app/api/mcp/actions";
import { Download, Search } from "lucide-react";
import { Input } from "ui/input";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function SmitheryBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const t = useTranslations();
  const router = useRouter();

  const handleInstall = async (mcp: SmitheryMVP) => {
    setInstalling(mcp.name);
    try {
      // Parse the command to extract args
      // format: "npx -y @smithery/cli run @smithery/package ..."
      const parts = mcp.command.split(" ");
      const args = parts.slice(1); // remove 'npx'

      // Construct configuration
      const config = {
        command: "npx",
        args: args,
      };

      await saveMcpClientAction({
        name: mcp.name,
        config: config,
        visibility: "private",
        enabled: true,
        userId: "",
      });

      toast.success(t("MCP.configurationSavedSuccessfully"));
      router.refresh();
      router.push("/mcp"); // Redirect to dashboard to see it
    } catch (error) {
      console.error("Failed to install Smithery MCP:", error);
      toast.error(error instanceof Error ? error.message : "Failed to install");
    } finally {
      setInstalling(null);
    }
  };

  const filteredMcps = featuredSmitheryMcps.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMcps.map((mcp) => (
          <Card key={mcp.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* Placeholder for icon */}
                <span>{mcp.name}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {mcp.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {mcp.command}
              </code>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleInstall(mcp)}
                disabled={installing === mcp.name}
              >
                {installing === mcp.name ? (
                  t("Common.saving")
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Install
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filteredMcps.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            {t("Common.noResults")}
          </div>
        )}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Want more? Browse the full registry at Smithery.ai
        </p>
        <a
          href="https://smithery.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm font-medium"
        >
          Visit Smithery.ai &rarr;
        </a>
      </div>
    </div>
  );
}
