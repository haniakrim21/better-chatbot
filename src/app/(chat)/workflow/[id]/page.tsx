import {
  convertDBEdgeToUIEdge,
  convertDBNodeToUINode,
} from "lib/ai/workflow/shared.workflow";
import Workflow from "@/components/workflow/workflow";
import { workflowRepository } from "lib/db/repository";
import { redirect } from "next/navigation";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { Agent } from "app-types/agent";
import { getSession } from "auth/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const hasAccess = await workflowRepository.checkAccess(id, session.user.id);
  if (!hasAccess) {
    redirect("/discover");
  }

  const workflow = await workflowRepository.selectStructureById(id);
  if (!workflow) {
    redirect("/discover");
  }
  const hasEditAccess = await workflowRepository.checkAccess(
    id,
    session.user.id,
    false,
  );

  const initialNodes = workflow.nodes.map((node) =>
    convertDBNodeToUINode(id, node),
  );
  const initialEdges = workflow.edges.map(convertDBEdgeToUIEdge);

  // Fetch the Workflow Creator agent
  const agents = await pgAgentRepository.selectAgents(
    session.user.id,
    ["all"],
    1000,
  );
  const summary = agents.find((a) => a.name === "Workflow Creator");

  let workflowAgent: Agent | null = null;
  if (summary) {
    workflowAgent = await pgAgentRepository.selectAgentById(
      summary.id,
      session.user.id,
    );
  }

  return (
    <Workflow
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      workflowId={id}
      hasEditAccess={hasEditAccess}
      agent={workflowAgent || undefined}
    />
  );
}
