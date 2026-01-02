import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverCard } from "@/components/discover/discover-card";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { getCurrentUser } from "lib/auth/permissions";
import { installMcpServerAction } from "@/app/api/mcp/actions";

export default async function DiscoverMcpPage() {
  const user = await getCurrentUser();
  const userId = user?.id || "";

  // Fetch all accessible MCP servers
  const mcps = await pgMcpRepository.selectAllForUser(userId);

  // Filter for public only
  const publicMcps = mcps.filter((m) => m.visibility === "public");

  return (
    <DiscoverLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {publicMcps.map((mcp) => (
          <DiscoverCard
            key={mcp.id}
            id={mcp.id}
            type="mcp"
            title={mcp.name}
            description="An MCP server to extend capabilities."
            icon="🔌"
            author={{
              name: mcp.userName || "System",
              avatar: mcp.userAvatar || undefined,
            }}
            tags={mcp.tags || ["plugin", "tool"]}
            usageCount={mcp.usageCount || 0}
            onAction={installMcpServerAction.bind(null, mcp.id)}
          />
        ))}
        {publicMcps.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2 opacity-50">
            <div className="text-4xl">🔌</div>
            <h3 className="text-xl font-medium">No public plugins found</h3>
            <p className="text-muted-foreground">Check back later!</p>
          </div>
        )}
      </div>
    </DiscoverLayout>
  );
}
