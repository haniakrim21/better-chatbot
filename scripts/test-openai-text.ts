import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function testModel(modelId: string) {
  console.log(`Testing text model: ${modelId}...`);
  try {
    const { text } = await generateText({
      model: openai(modelId),
      prompt: "Say hello",
    });
    console.log(`✅ Success with ${modelId}! Output: ${text}`);
  } catch (error) {
    console.error(`❌ Failed with ${modelId}:`, error);
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set in environment.");
    return;
  }

  // Test the suspicious text model
  await testModel("gpt-4.1-mini");

  // Test a known working model
  await testModel("gpt-4o-mini");
}

main();
