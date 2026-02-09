import { getSession } from "auth/server";
import { workflowRepository } from "lib/db/repository";

/**
 * Export a workflow as a JSON template.
 * Strips user-specific data (userId, dates) and returns
 * a portable template that can be imported elsewhere.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hasAccess = await workflowRepository.checkAccess(
    id,
    session.user.id,
    true, // readOnly access is sufficient for export
  );
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workflow = await workflowRepository.selectStructureById(id);
  if (!workflow) {
    return new Response("Workflow not found", { status: 404 });
  }

  // Build portable template
  const template = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    workflow: {
      name: workflow.name,
      description: workflow.description,
      icon: workflow.icon,
      tags: workflow.tags,
    },
    nodes: workflow.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      name: node.name,
      description: node.description,
      nodeConfig: node.nodeConfig,
      uiConfig: node.uiConfig,
    })),
    edges: workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      uiConfig: edge.uiConfig,
    })),
  };

  return new Response(JSON.stringify(template, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${workflow.name.replace(/[^a-zA-Z0-9-_]/g, "_")}-workflow.json"`,
    },
  });
}
