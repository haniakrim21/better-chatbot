import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverCard } from "@/components/discover/discover-card";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { getCurrentUser } from "lib/auth/permissions";
import { incrementAgentUsageAction } from "@/app/api/agent/actions";

export const dynamic = "force-dynamic";

export default async function DiscoverAgentsPage() {
  const user = await getCurrentUser();
  const userId = user?.id || "";

  // Fetch all accessible agents
  const agents = await pgAgentRepository.selectAgents(userId, ["all"], 100);

  // Filter for public only for the "Discovery" aspect
  const publicAgents = agents.filter((a) => a.visibility === "public");

  return (
    <DiscoverLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        {publicAgents.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2 opacity-50">
            <div className="text-4xl">🤖</div>
            <h3 className="text-xl font-medium">No public assistants found</h3>
            <p className="text-muted-foreground">
              Check back later or publish your own!
            </p>
          </div>
        )}
      </div>
    </DiscoverLayout>
  );
}
