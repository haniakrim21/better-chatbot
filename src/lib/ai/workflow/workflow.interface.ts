import { Node } from "@xyflow/react";
import { ChatModel } from "app-types/chat";
import { ObjectJsonSchema7, TipTapMentionJsonContent } from "app-types/util";
import { JSONSchema7 } from "json-schema";
import { ConditionBranches } from "./condition";

/**
 * Enum defining all available node types in the workflow system.
 * When adding a new node type:
 * 1. Add the new kind here
 * 2. Create corresponding NodeData type below
 * 3. Implement executor in node-executor.ts
 * 4. Add validation in node-validate.ts
 * 5. Create UI config component in components/workflow/node-config/
 */
export enum NodeKind {
  Input = "input", // Entry point of workflow - receives initial data
  LLM = "llm", // Large Language Model interaction node
  Condition = "condition", // Conditional branching node
  Note = "note", // Documentation/annotation node
  Tool = "tool", // MCP tool execution node
  Http = "http", // HTTP request node
  Template = "template", // Template processing node
  MultiAgent = "multiagent", // Multi-agent session node
  Code = "code", // Code execution node - runs sandboxed JavaScript
  Loop = "loop", // Loop/iterator node - iterates over arrays
  Delay = "delay", // Delay/wait node - pauses execution
  SubWorkflow = "subworkflow", // Calls another workflow as a step
  Storage = "storage", // Read/write key-value store for stateful workflows
  Approval = "approval", // Human-in-the-loop approval gate
  Output = "output", // Exit point of workflow - produces final result
}

/**
 * Error handling configuration for workflow nodes.
 * Enables retry logic and fallback behavior on node failure.
 */
export type NodeErrorHandling = {
  /** Whether error handling is enabled for this node */
  enabled: boolean;
  /** Number of retry attempts before giving up (0 = no retries) */
  maxRetries: number;
  /** Delay between retries in ms */
  retryDelayMs: number;
  /** What to do when all retries are exhausted */
  onFailure: "stop" | "continue" | "fallback";
  /** Default value to use when onFailure is "continue" */
  fallbackValue?: any;
};

/**
 * Base interface for all workflow node data.
 * Every node must have these common properties.
 */
export type BaseWorkflowNodeDataData<
  T extends {
    kind: NodeKind;
  },
> = {
  id: string;
  name: string; // unique name within workflow
  description?: string;
  /**
   * Defines the output schema of this node.
   * Other nodes can reference fields from this schema as their inputs.
   * This enables data flow between connected nodes.
   */
  outputSchema: ObjectJsonSchema7;
  /** Optional error handling / retry configuration */
  errorHandling?: NodeErrorHandling;
} & T;

/**
 * Reference to a field from another node's output.
 * Used to create data dependencies between nodes.
 */
export type OutputSchemaSourceKey = {
  nodeId: string; // ID of the source node
  path: string[]; // Path to the specific field in the output (e.g., ["result", "data"])
};

/**
 * MCP (Model Context Protocol) tool definition.
 * Currently only supports MCP tools, but extensible for other tool types.
 */
type MCPTool = {
  type: "mcp-tool";
  serverId: string;
  serverName: string;
};

type DefaultTool = {
  type: "app-tool";
};

/**
 * Workflow tool key that defines available tools for Tool nodes.
 */
export type WorkflowToolKey = {
  id: string; // tool Name
  description: string;
  parameterSchema?: JSONSchema7; // Input schema for the tool
  returnSchema?: JSONSchema7; // Output schema for the tool
} & (MCPTool | DefaultTool);

// Node Data Types - Each node kind has its specific data structure

/**
 * Input node: Entry point of the workflow
 * Receives initial data and passes it to connected nodes
 */
export type InputNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Input;
}>;

/**
 * Output node: Exit point of the workflow
 * Collects data from previous nodes and produces final result
 */
export type OutputNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Output;
}> & {
  outputData: {
    key: string; // Key name in final output
    source?: OutputSchemaSourceKey; // Reference to source node's output
  }[];
};

/**
 * Note node: For documentation and annotations
 * Does not affect workflow execution, used for documentation purposes
 */
export type NoteNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Note;
}>;

/**
 * Tool node: Executes external tools (primarily MCP tools)
 * Can optionally use LLM to generate tool parameters from a message
 */
export type ToolNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Tool;
  tool?: WorkflowToolKey; // Selected tool to execute
  model: ChatModel; // LLM model for parameter generation
  message?: TipTapMentionJsonContent; // Optional message to generate parameters
}>;

/**
 * LLM node: Interacts with Large Language Models
 * Supports multiple messages and can reference outputs from previous nodes
 */
export type LLMNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.LLM;
}> & {
  model: ChatModel;
  messages: {
    role: "user" | "assistant" | "system";
    content?: TipTapMentionJsonContent; // Can reference other node outputs via mentions
  }[];
};

/**
 * Multi-Agent node: Runs an autonomous collaboration between two agents
 * Outputs the final result of the collaborative session
 */
export type MultiAgentNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.MultiAgent;
}> & {
  roleAId?: string; // ID of the first agent (Inception)
  roleBId?: string; // ID of the second agent (Execution)
  taskDescription?: TipTapMentionJsonContent; // The task to collaborate on
  maxTurns: number;
};

/**
 * Condition node: Provides conditional branching in workflows
 * Evaluates conditions and routes execution to different paths
 */
export type ConditionNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Condition;
}> & {
  branches: ConditionBranches; // if-elseIf-else structure for conditional logic
};

/**
 * HTTP request method type
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

/**
 * Simple value type that can be a literal string or reference to another node's output
 */
export type HttpValue = string | OutputSchemaSourceKey;

/**
 * HTTP node: Performs HTTP requests to external services
 * Supports all standard HTTP methods with configurable parameters
 */
export type HttpNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Http;
}> & {
  url?: HttpValue; // Request URL (can reference other node outputs)
  method: HttpMethod; // HTTP method
  headers: {
    key: string;
    value?: HttpValue; // Header value (can reference other node outputs)
  }[]; // Request headers
  query: {
    key: string;
    value?: HttpValue; // Query parameter value (can reference other node outputs)
  }[]; // Query parameters
  body?: HttpValue; // Request body (can reference other node outputs)
  timeout?: number; // Request timeout in milliseconds (default: 30000)
};

/**
 * Template node: Processes text templates with variable substitution
 * Supports different template engines for flexible content generation
 */
export type TemplateNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Template;
}> & {
  template: {
    type: "tiptap";
    tiptap: TipTapMentionJsonContent;
  };
};

/**
 * Supported languages for the Code node.
 */
export type CodeLanguage = "javascript";

/**
 * Code node: Executes custom JavaScript code within the workflow.
 * The code receives an `inputs` object containing outputs from previous nodes
 * and must return a value that becomes the node's output.
 *
 * Security: Code runs in a sandboxed Function constructor with no access
 * to Node.js APIs, file system, network, or global scope.
 */
export type CodeNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Code;
}> & {
  language: CodeLanguage;
  code: string; // The JavaScript code to execute
  timeout?: number; // Execution timeout in ms (default: 5000)
  inputMappings: {
    variableName: string; // Variable name accessible in code as inputs.<variableName>
    source?: OutputSchemaSourceKey; // Reference to source node's output
  }[];
};

/**
 * Loop node: Iterates over an array and executes connected nodes for each item.
 * The array source comes from a previous node's output.
 * Each iteration receives the current item and index.
 */
export type LoopNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Loop;
}> & {
  arraySource?: OutputSchemaSourceKey; // Reference to array in a previous node's output
  itemVariable: string; // Variable name for current item (default: "item")
  indexVariable: string; // Variable name for current index (default: "index")
  maxIterations: number; // Safety limit (default: 100)
  mode: "sequential" | "parallel"; // How to process items
};

/**
 * Delay node: Pauses workflow execution for a specified duration.
 * Useful for rate limiting, waiting for external processes, or scheduling.
 */
export type DelayNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Delay;
}> & {
  delayMs: number; // Delay duration in milliseconds
  delayType: "fixed" | "dynamic"; // Fixed value or from a previous node's output
  dynamicSource?: OutputSchemaSourceKey; // Source for dynamic delay value
};

/**
 * Sub-Workflow node: Calls another published workflow as a step.
 * Maps input data from the current workflow to the child workflow's input schema.
 */
export type SubWorkflowNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.SubWorkflow;
}> & {
  workflowId?: string; // ID of the workflow to invoke
  workflowName?: string; // Display name (cached for UI)
  inputMappings: {
    key: string; // Key in the child workflow's input schema
    source?: OutputSchemaSourceKey; // Reference to source node's output
  }[];
  timeout?: number; // Execution timeout in ms (default: 300000 = 5 min)
};

/**
 * Storage node: Read/write operations on a persistent key-value store.
 * Data persists across workflow runs and can be shared between workflows.
 */
export type StorageNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Storage;
}> & {
  operation: "get" | "set" | "delete" | "list";
  storageKey?: string | OutputSchemaSourceKey; // Static string or reference to another node
  storageValue?: OutputSchemaSourceKey; // For 'set' operation - reference to data to store
  ttlMs?: number; // Optional TTL for 'set' operation (0 = no expiry)
};

/**
 * Approval node: Human-in-the-loop gate that pauses workflow execution.
 *
 * When reached, the workflow pauses and sends a notification/prompt
 * to the user. Execution resumes only after explicit approval or rejection.
 *
 * Implementation: Uses a time-limited polling approach. The node
 * waits for up to `timeoutMs` for approval, checking at regular intervals.
 * If timeout is reached, the configured `onTimeout` action is taken.
 */
export type ApprovalNodeData = BaseWorkflowNodeDataData<{
  kind: NodeKind.Approval;
}> & {
  message?: TipTapMentionJsonContent; // Message shown to approver
  timeoutMs: number; // Max wait time in ms (default: 300000 = 5 min)
  onTimeout: "approve" | "reject" | "stop"; // What happens if no response
};

/**
 * Union type of all possible node data types.
 * When adding a new node type, include it in this union.
 */
export type WorkflowNodeData =
  | InputNodeData
  | OutputNodeData
  | LLMNodeData
  | NoteNodeData
  | ToolNodeData
  | ConditionNodeData
  | HttpNodeData
  | TemplateNodeData
  | MultiAgentNodeData
  | CodeNodeData
  | LoopNodeData
  | DelayNodeData
  | SubWorkflowNodeData
  | StorageNodeData
  | ApprovalNodeData;

/**
 * Runtime fields added during workflow execution
 */
export type NodeRuntimeField = {
  isNew?: boolean; // Flag for newly created nodes
  status?: "fail" | "running" | "success"; // Execution status
};

/**
 * UI representation of a workflow node with runtime information
 */
export type UINode<Kind extends NodeKind = NodeKind> = Node<
  Extract<WorkflowNodeData, { kind: Kind }> & { runtime?: NodeRuntimeField }
>;

/**
 * Runtime history record for node execution tracking
 * Used for debugging and monitoring workflow execution
 */
export type NodeRuntimeHistory = {
  id: string;
  nodeId: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  kind: NodeKind;
  error?: string;
  status: "fail" | "running" | "success";
  result?: {
    input?: any; // Input data passed to the node
    output?: any; // Output data produced by the node
  };
};
