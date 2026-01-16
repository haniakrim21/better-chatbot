import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function testToolInternals() {
  console.log("Testing openai.tools.imageGeneration internals...");

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return;
  }

  const tool = openai.tools.imageGeneration({
    model: "dall-e-3",
    outputFormat: "webp",
  });

  console.log("Tool definition keys:", Object.keys(tool));

  console.log("Executing tool manually...");
  try {
    // @ts-ignore
    const result = await tool.execute(
      {
        prompt: "A red ball",
      },
      {
        abortSignal: undefined,
        toolCallId: "test-id",
        messages: [],
      },
    );
    console.log("Execution Result Keys:", Object.keys(result));
    console.log("Execution Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Execution failed:", e);
  }
}

testToolInternals();
