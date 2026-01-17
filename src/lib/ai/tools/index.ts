export enum AppDefaultToolkit {
  Visualization = "visualization",
  WebSearch = "webSearch",
  Http = "http",
  Code = "code",
  Workflow = "workflow",
  Canvas = "canvas",
  Compute = "compute",
  Rag = "rag",
}

export enum DefaultToolName {
  CreatePieChart = "createPieChart",
  CreateBarChart = "createBarChart",
  CreateLineChart = "createLineChart",
  CreateTable = "createTable",
  WebSearch = "webSearch",
  WebContent = "webContent",
  Http = "http",
  JavascriptExecution = "mini-javascript-execution",
  PythonExecution = "python-execution",
  ListWorkflows = "list-workflows",
  GetWorkflowStructure = "get-workflow-structure",
  CreateWorkflow = "create-workflow",
  UpdateWorkflowStructure = "update-workflow-structure",
  DeleteWorkflow = "delete-workflow",
  DraftContent = "draftContent",
  EditSelection = "editSelection",
  RunTerminalCommand = "runTerminalCommand",
  RetrieveKnowledge = "retrieveKnowledge",
}

export const SequentialThinkingToolName = "sequential-thinking";

// WebContainer Tools
export * from "./compute/execute";
export const ImageToolName = "image-manager";
