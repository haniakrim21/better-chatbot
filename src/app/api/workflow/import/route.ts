import { getSession } from "auth/server";
import { canCreateWorkflow } from "lib/auth/permissions";
import { workflowRepository } from "lib/db/repository";
import { generateUUID } from "lib/utils";

/**
 * Import a workflow from a JSON template.
 * Creates a new workflow with fresh IDs and assigns it to the current user.
 *
 * The template format matches the export format from /api/workflow/[id]/export.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const canCreate = await canCreateWorkflow();
  if (!canCreate) {
    return Response.json(
      { error: "You don't have permission to create workflows" },
      { status: 403 },
    );
  }

  let template: any;
  try {
    template = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON template" }, { status: 400 });
  }

  // Validate template structure
  if (!template.version || !template.workflow || !template.nodes) {
    return Response.json(
      { error: "Invalid workflow template format" },
      { status: 400 },
    );
  }

  // Create new workflow
  const workflow = await workflowRepository.save(
    {
      name: `${template.workflow.name} (imported)`,
      description: template.workflow.description,
      icon: template.workflow.icon,
      userId: session.user.id,
      tags: template.workflow.tags,
    },
    true, // noGenerateInputNode - we'll import the full structure
  );

  // Generate new IDs for nodes and edges while maintaining internal references
  const nodeIdMap = new Map<string, string>();
  for (const node of template.nodes) {
    const newId = generateUUID();
    nodeIdMap.set(node.id, newId);
  }

  // Remap node IDs in the imported data
  const importedNodes = template.nodes.map((node: any) => ({
    id: nodeIdMap.get(node.id)!,
    workflowId: workflow.id,
    kind: node.kind,
    name: node.name,
    description: node.description || "",
    nodeConfig: remapNodeConfig(node.nodeConfig, nodeIdMap),
    uiConfig: node.uiConfig || { position: { x: 0, y: 0 } },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const importedEdges = (template.edges || []).map((edge: any) => ({
    id: generateUUID(),
    workflowId: workflow.id,
    source: nodeIdMap.get(edge.source) || edge.source,
    target: nodeIdMap.get(edge.target) || edge.target,
    uiConfig: edge.uiConfig || {},
    createdAt: new Date(),
  }));

  // Save the imported structure
  await workflowRepository.saveStructure({
    workflowId: workflow.id,
    nodes: importedNodes,
    edges: importedEdges,
  });

  return Response.json(workflow, { status: 201 });
}

/**
 * Recursively remaps node IDs in a node config object.
 * This handles OutputSchemaSourceKey references that point to other nodes.
 */
function remapNodeConfig(config: any, nodeIdMap: Map<string, string>): any {
  if (!config || typeof config !== "object") return config;

  if (Array.isArray(config)) {
    return config.map((item) => remapNodeConfig(item, nodeIdMap));
  }

  const remapped: any = {};
  for (const [key, value] of Object.entries(config)) {
    if (key === "nodeId" && typeof value === "string" && nodeIdMap.has(value)) {
      remapped[key] = nodeIdMap.get(value);
    } else if (typeof value === "object" && value !== null) {
      remapped[key] = remapNodeConfig(value, nodeIdMap);
    } else {
      remapped[key] = value;
    }
  }
  return remapped;
}
