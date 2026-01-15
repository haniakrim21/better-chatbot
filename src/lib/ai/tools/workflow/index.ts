import { tool as createTool } from "ai";
import { z } from "zod";
import { workflowRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { NodeKind, UINode } from "lib/ai/workflow/workflow.interface";
import {
  convertUIEdgeToDBEdge,
  convertUINodeToDBNode,
} from "lib/ai/workflow/shared.workflow";
import { defaultObjectJsonSchema } from "lib/ai/workflow/shared.workflow";

// Schema Definitions
const WorkflowCreateSchema = z.object({
  name: z.string().describe("The name of the workflow"),
  description: z.string().optional().describe("Description of the workflow"),
  icon: z
    .string()
    .optional()
    .describe("React icon name (e.g., 'Target', 'Zap')"),
  isPublished: z.boolean().optional().default(false),
});

const NodeSchema = z.object({
  id: z.string(),
  name: z.string().describe("Unique identifier for the node"),
  kind: z
    .nativeEnum(NodeKind)
    .describe(
      "Type of the node (INPUT, LLM_GENERATION, SEARCH_CONDITION, etc.)",
    ),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  config: z.record(z.string(), z.any()).optional(),
  title: z.string().optional(), // UI label
});

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string().describe("Source node ID"),
  target: z.string().describe("Target node ID"),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
});

const WorkflowStructureUpdateSchema = z.object({
  workflowId: z.string().describe("ID of the workflow to update"),
  nodes: z.array(NodeSchema).describe("List of nodes in the workflow"),
  edges: z.array(EdgeSchema).describe("List of edges connecting the nodes"),
  deleteNodes: z
    .array(z.string())
    .optional()
    .describe("IDs of nodes to delete"),
  deleteEdges: z
    .array(z.string())
    .optional()
    .describe("IDs of edges to delete"),
});

// Tools

export const listWorkflowsTool = createTool({
  description: "List all workflows available to the current user",
  inputSchema: z.object({
    limit: z.number().optional().describe("Limit the number of results"),
  }),
  execute: async ({ limit }) => {
    const session = await getSession();
    if (!session) return "Unauthorized";
    // Assuming selectAll handles filtering by user/team
    const workflows = await workflowRepository.selectAll(session.user.id);
    return workflows.slice(0, limit || 20);
  },
});

export const getWorkflowStructureTool = createTool({
  description:
    "Get the detailed structure (nodes and edges) of a specific workflow",
  inputSchema: z.object({
    workflowId: z.string().describe("The ID of the workflow"),
  }),
  execute: async ({ workflowId }) => {
    const session = await getSession();
    if (!session) return "Unauthorized";

    const hasAccess = await workflowRepository.checkAccess(
      workflowId,
      session.user.id,
    );
    if (!hasAccess) return "Unauthorized or Workflow not found";

    const structure = await workflowRepository.selectStructureById(workflowId);
    return structure;
  },
});

export const createWorkflowTool = createTool({
  description: "Create a new empty workflow",
  inputSchema: WorkflowCreateSchema,
  execute: async (data) => {
    const session = await getSession();
    if (!session) return "Unauthorized";

    const workflow = await workflowRepository.save(
      {
        ...data,
        icon: data.icon ? { type: "lucide", value: data.icon } : undefined,
        userId: session.user.id,
        visibility: "private", // Default to private
      },
      false, // noGenerateInputNode - let the user/agent define structure later if needed, or default false
    );
    return workflow;
  },
});

export const updateWorkflowStructureTool = createTool({
  description:
    "Update the graph structure of a workflow (nodes and edges). Replaces existing structure.",
  inputSchema: WorkflowStructureUpdateSchema,
  execute: async (data) => {
    const session = await getSession();
    if (!session) return "Unauthorized";

    const hasAccess = await workflowRepository.checkAccess(
      data.workflowId,
      session.user.id,
      false,
    ); // false = write access
    if (!hasAccess) return "Unauthorized or Workflow not found";

    const dbNodes = data.nodes.map((n) => {
      // Construct a temporary UINode to reuse conversion logic
      const uiNode: UINode = {
        id: n.id,
        position: n.position,
        data: {
          id: n.id,
          name: n.name,
          kind: n.kind,
          outputSchema: defaultObjectJsonSchema, // Default if not provided
          ...n.config,
        } as any, // Cast because we might miss some specific node data fields
        type: "default",
      };
      const dbNode = convertUINodeToDBNode(data.workflowId, uiNode);
      return {
        ...dbNode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const dbEdges = data.edges.map((e) => {
      const dbEdge = convertUIEdgeToDBEdge(data.workflowId, {
        ...e,
        id: e.id,
        source: e.source,
        target: e.target,
      } as any);
      return {
        ...dbEdge,
        createdAt: new Date(),
      };
    });

    await workflowRepository.saveStructure({
      workflowId: data.workflowId,
      nodes: dbNodes,
      edges: dbEdges,
      deleteNodes: data.deleteNodes,
      deleteEdges: data.deleteEdges,
    });

    return { success: true, workflowId: data.workflowId };
  },
});

export const deleteWorkflowTool = createTool({
  description: "Delete a workflow",
  inputSchema: z.object({
    workflowId: z.string(),
  }),
  execute: async ({ workflowId }) => {
    const session = await getSession();
    if (!session) return "Unauthorized";
    const hasAccess = await workflowRepository.checkAccess(
      workflowId,
      session.user.id,
      false,
    );
    if (!hasAccess) return "Unauthorized";

    await workflowRepository.delete(workflowId);
    return { success: true };
  },
});
