import { getCurrentUser } from "lib/auth/permissions";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { incrementAgentUsageAction } from "@/app/api/agent/actions";
import { installMcpServerAction } from "@/app/api/mcp/actions";
import { DiscoverCard } from "@/components/discover/discover-card";
import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverSearch } from "@/components/discover/discover-search";

export default async function DiscoverPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();

  const userId = user?.id || "";

  const agents = await pgAgentRepository.selectAgents(userId, ["all"], 20);
  const mcps = await pgMcpRepository.selectAllForUser(userId);
  const workflows = await pgWorkflowRepository.selectAll(userId);

  const publicAgents = agents
    .filter((a) => a.visibility === "public")
    .slice(0, 12);
  const publicMcps = mcps.filter((m) => m.visibility === "public").slice(0, 6);
  const publicWorkflows = workflows
    .filter((w) => w.visibility === "public")
    .slice(0, 6);

  // Trending: sort by usageCount descending, top 4
  const trendingAgents = [...publicAgents]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 4);

  // Categories derived from agent tags
  const allTags = publicAgents.flatMap((a) => a.tags || []);
  const tagCounts = allTags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topCategories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  const totalCount =
    publicAgents.length + publicMcps.length + publicWorkflows.length;

  return (
    <DiscoverLayout>
      <div className="flex flex-col gap-8">
        {/* Search + Stats Bar */}
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <DiscoverSearch
            totalCount={totalCount}
            agentCount={publicAgents.length}
            pluginCount={publicMcps.length}
            workflowCount={publicWorkflows.length}
          />

          {/* Category Pills */}
          {topCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topCategories.map(({ tag, count }) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/60 text-secondary-foreground border border-border/30 hover:bg-secondary transition-colors"
                >
                  #{tag}
                  <span className="text-muted-foreground/60">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Trending Section */}
        {trendingAgents.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                Trending
                <span className="text-xs font-normal text-muted-foreground bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Hot
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trendingAgents.map((agent) => (
                <DiscoverCard
                  key={`trending-${agent.id}`}
                  id={agent.id}
                  type="agent"
                  title={agent.name}
                  description={agent.description || "No description provided."}
                  icon={agent.icon as any}
                  author={{
                    name: agent.userName || "System",
                    avatar: agent.userAvatar || undefined,
                  }}
                  tags={agent.tags || []}
                  usageCount={agent.usageCount || 0}
                  onAction={incrementAgentUsageAction.bind(null, agent.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Featured Assistants */}
        {publicAgents.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Featured Assistants
              </h2>
              <Link
                href="/discover/agents"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {publicAgents.slice(0, 8).map((agent) => (
                <DiscoverCard
                  key={agent.id}
                  id={agent.id}
                  type="agent"
                  title={agent.name}
                  description={agent.description || "No description provided."}
                  icon={agent.icon as any}
                  author={{
                    name: agent.userName || "System",
                    avatar: agent.userAvatar || undefined,
                  }}
                  tags={agent.tags || []}
                  usageCount={agent.usageCount || 0}
                  onAction={incrementAgentUsageAction.bind(null, agent.id)}
                />
              ))}
            </div>
          </div>
        )}
        {publicAgents.length === 0 && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {t("Discover.tabs.featured")}
                <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  Popular
                </span>
              </h2>
            </div>
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No public agents found. Be the first to publish one!
            </div>
          </section>
        )}

        {publicMcps.length > 0 && (
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Featured Plugins
              </h2>
              <Link
                href="/discover/mcp"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          </div>
        )}
        {publicMcps.length === 0 && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {t("Discover.tabs.mcp")}
              </h2>
            </div>
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No public plugins available yet.
            </div>
          </section>
        )}

        {publicWorkflows.length > 0 && (
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Featured Workflows
              </h2>
              <Link
                href="/discover/workflows"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicWorkflows.map((workflow) => (
                <DiscoverCard
                  key={workflow.id}
                  id={workflow.id}
                  type="agent"
                  title={workflow.name}
                  description={
                    workflow.description || "No description provided."
                  }
                  icon={workflow.icon as any}
                  author={{
                    name: workflow.userName || "System",
                    avatar: workflow.userAvatar || undefined,
                  }}
                  tags={[]}
                  usageCount={0}
                  customActionLink={`/workflow/${workflow.id}`}
                  customActionLabel="Use"
                />
              ))}
            </div>
          </div>
        )}
        {publicWorkflows.length === 0 && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Featured Workflows
              </h2>
            </div>
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No public workflows available yet.
            </div>
          </section>
        )}
      </div>
    </DiscoverLayout>
  );
}
