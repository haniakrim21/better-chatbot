import { DiscoverLayout } from "@/components/discover/discover-layout";
import { DiscoverCard } from "@/components/discover/discover-card";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import { getCurrentUser } from "lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function DiscoverWorkflowsPage() {
  const user = await getCurrentUser();
  const userId = user?.id || "";

  // Fetch all accessible workflows
  const workflows = await pgWorkflowRepository.selectAll(userId);

  // Filter for public only or owned by user ?? Usually Discover shows public
  // Repository method selectAll handles visibility: public/readonly OR userId
  // So we just filter for public if we want to show only community resources, or show all valid ones.
  // Let's show all valid ones returned by selectAll

  return (
    <DiscoverLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {workflows.map((workflow) => (
          <DiscoverCard
            key={workflow.id}
            id={workflow.id}
            type="agent" // Reusing agent styling for now, or maybe make a new type
            title={workflow.name}
            description={workflow.description || "No description provided."}
            icon={workflow.icon as any}
            author={{
              name: workflow.userName || "System",
              avatar: workflow.userAvatar || undefined,
            }}
            tags={workflow.tags || []}
            usageCount={0} // WorkflowTable has no usageCount.
            // Custom action link for workflows
            customActionLink={`/workflow/${workflow.id}`}
            customActionLabel="Use"
          />
        ))}
        {workflows.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-2 opacity-50">
            <div className="text-4xl">⚡</div>
            <h3 className="text-xl font-medium">No workflows found</h3>
            <p className="text-muted-foreground">Check back later!</p>
          </div>
        )}
      </div>
    </DiscoverLayout>
  );
}
