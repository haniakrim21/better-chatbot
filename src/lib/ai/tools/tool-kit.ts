import { createPieChartTool } from "./visualization/create-pie-chart";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createTableTool } from "./visualization/create-table";
import { exaSearchTool, exaContentsTool } from "./web/web-search";
import { AppDefaultToolkit, DefaultToolName } from ".";
import { Tool } from "ai";
import { httpFetchTool } from "./http/fetch";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";
import {
  listWorkflowsTool,
  getWorkflowStructureTool,
  createWorkflowTool,
  updateWorkflowStructureTool,
  deleteWorkflowTool,
} from "./workflow";
import { draftContentTool } from "./canvas/draft-content";
import { editSelectionTool } from "./canvas/edit-selection";
import { runTerminalCommandTool } from "./compute/execute";
import { retrieveKnowledgeTool } from "./rag/retrieve";

export const APP_DEFAULT_TOOL_KIT: Record<
  AppDefaultToolkit,
  Record<string, Tool>
> = {
  [AppDefaultToolkit.Visualization]: {
    [DefaultToolName.CreatePieChart]: createPieChartTool,
    [DefaultToolName.CreateBarChart]: createBarChartTool,
    [DefaultToolName.CreateLineChart]: createLineChartTool,
    [DefaultToolName.CreateTable]: createTableTool,
  },
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.WebSearch]: exaSearchTool,
    [DefaultToolName.WebContent]: exaContentsTool,
  },
  [AppDefaultToolkit.Http]: {
    [DefaultToolName.Http]: httpFetchTool,
  },
  [AppDefaultToolkit.Code]: {
    [DefaultToolName.JavascriptExecution]: jsExecutionTool,
    [DefaultToolName.PythonExecution]: pythonExecutionTool,
  },
  [AppDefaultToolkit.Workflow]: {
    [DefaultToolName.ListWorkflows]: listWorkflowsTool,
    [DefaultToolName.GetWorkflowStructure]: getWorkflowStructureTool,
    [DefaultToolName.CreateWorkflow]: createWorkflowTool,
    [DefaultToolName.UpdateWorkflowStructure]: updateWorkflowStructureTool,
    [DefaultToolName.DeleteWorkflow]: deleteWorkflowTool,
  },
  [AppDefaultToolkit.Canvas]: {
    [DefaultToolName.DraftContent]: draftContentTool,
    [DefaultToolName.EditSelection]: editSelectionTool,
  },
  [AppDefaultToolkit.Compute]: {
    [DefaultToolName.RunTerminalCommand]: runTerminalCommandTool,
  },
  [AppDefaultToolkit.Rag]: {
    [DefaultToolName.RetrieveKnowledge]: retrieveKnowledgeTool,
  },
};
