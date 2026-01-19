import { draftContentTool } from "../src/lib/ai/tools/canvas/draft-content";
import { z } from "zod";

console.log("Debugging DraftContent Tool Structure...");

try {
  const toolAny = draftContentTool as any;
  console.log("Keys:", Object.keys(toolAny));

  if (toolAny.parameters) {
    console.log("Found 'parameters'.");
    const shape = toolAny.parameters.shape;
    if (shape && shape.action) {
      console.log("Found 'action' parameter.");
      // Check if default value is set (Zod doesn't easily expose 'defaultValue' property on the schema instance publicly across versions, but let's check basic validity)
      console.log("Action type:", shape.action._def.typeName);
    } else {
      console.error("FAIL: 'action' parameter missing in shape");
    }
  } else {
    console.log(
      "No 'parameters' property found directly (might be normalized by AI SDK).",
    );
  }

  console.log("SUCCESS: Tool imported without crashing.");
} catch (error) {
  console.error("FAIL: Error during inspection:", error);
  process.exit(1);
}
