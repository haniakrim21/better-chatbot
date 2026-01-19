import { draftContentTool } from "../src/lib/ai/tools/canvas/draft-content";
import { runTerminalCommandTool } from "../src/lib/ai/tools/compute/execute";

console.log("Inspecting Tool Object Properties (AI SDK v6)...");

function inspect(name: string, tool: any) {
  console.log(`\n--- ${name} ---`);
  console.log("Keys:", Object.keys(tool));
  console.log("Parameters (prop):", tool.parameters ? "Present" : "Undefined");
  console.log(
    "InputSchema (prop):",
    tool.inputSchema ? "Present" : "Undefined",
  );
  // Check if there are hidden non-enumerable properties or symbols?
}

inspect("DraftContent", draftContentTool);
inspect("RunTerminalCommand", runTerminalCommandTool);
