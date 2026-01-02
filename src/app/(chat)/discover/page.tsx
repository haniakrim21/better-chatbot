import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverCard } from "@/components/discover/discover-card";
import { getTranslations } from "next-intl/server";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import { getCurrentUser } from "lib/auth/permissions";
import { incrementAgentUsageAction } from "@/app/api/agent/actions";
import { installMcpServerAction } from "@/app/api/mcp/actions";
import Link from "next/link";

export default async function DiscoverPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();

  const userId = user?.id || "";

  const agents = await pgAgentRepository.selectAgents(userId, ["all"], 6);
  const mcps = await pgMcpRepository.selectAllForUser(userId);
  const workflows = await pgWorkflowRepository.selectAll(userId);

  const publicAgents = agents
    .filter((a) => a.visibility === "public")
    .slice(0, 6);
  const publicMcps = mcps.filter((m) => m.visibility === "public").slice(0, 3);
  const publicWorkflows = workflows
    .filter((w) => w.visibility === "public")
    .slice(0, 3);

  return (
    <DiscoverLayout>
      <div className="flex flex-col gap-8">
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
              {publicAgents.map((agent) => (
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
                  type="agent" // Using 'agent' style for workflows, or update DiscoverCard to support 'workflow'
                  title={workflow.name}
                  description={
                    workflow.description || "No description provided."
                  }
                  icon={workflow.icon as any}
                  author={{
                    name: workflow.userName || "System",
                    avatar: workflow.userAvatar || undefined,
                  }}
                  tags={[]} // Workflows tags if available
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
