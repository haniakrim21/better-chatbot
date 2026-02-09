export enum AppDefaultToolkit {
  Visualization = "visualization",
  WebSearch = "webSearch",
  Http = "http",
  Code = "code",
  Workflow = "workflow",
  Canvas = "canvas",
  Compute = "compute",
  Rag = "rag",
  Document = "document",
}

export enum DefaultToolName {
  CreatePieChart = "CreatePieChart",
  CreateBarChart = "CreateBarChart",
  CreateLineChart = "CreateLineChart",
  CreateTable = "CreateTable",
  WebSearch = "WebSearch",
  WebContent = "WebContent",
  Http = "Http",
  JavascriptExecution = "JavascriptExecution",
  PythonExecution = "PythonExecution",
  ListWorkflows = "ListWorkflows",
  GetWorkflowStructure = "GetWorkflowStructure",
  CreateWorkflow = "CreateWorkflow",
  UpdateWorkflowStructure = "UpdateWorkflowStructure",
  DeleteWorkflow = "DeleteWorkflow",
  DraftContent = "DraftContent",
  EditSelection = "EditSelection",
  RunTerminalCommand = "RunTerminalCommand",
  RetrieveKnowledge = "RetrieveKnowledge",
  GenerateDocument = "GenerateDocument",
}

export const SequentialThinkingToolName = "SequentialThinking";

// WebContainer Tools
export * from "./compute/execute";
export const ImageToolName = "ImageManager";
export const VideoToolName = "VideoManager";
