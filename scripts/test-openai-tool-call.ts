import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function testToolCall() {
  console.log("Testing generateText with image_generation tool...");

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return;
  }

  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
      messages: [
        {
          role: "user",
          content: "Generate an image of a futuristic city",
        },
      ],
      tools: {
        image_generation: openai.tools.imageGeneration({
          outputFormat: "webp",
          model: "dall-e-3",
        }),
      },
      toolChoice: "required",
    });

    console.log("GenerateText result keys:", Object.keys(result));

    if (result.toolResults && result.toolResults.length > 0) {
      console.log(
        "First tool result keys:",
        Object.keys(result.toolResults[0]),
      );
      console.log(
        "First tool result (FULL JSON):",
        JSON.stringify(result.toolResults[0], null, 2),
      );
    } else {
      console.log("No tool results found.");
    }

    // Check for staticToolResults specifically
    if ("staticToolResults" in result) {
      console.log("✅ staticToolResults exists!");
    } else {
      console.log("❌ staticToolResults does NOT exist!");
    }
  } catch (error) {
    console.error("❌ Error during test:", error);
  }
}

testToolCall();
