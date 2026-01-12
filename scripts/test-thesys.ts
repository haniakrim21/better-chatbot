import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config();

async function testThesys() {
  console.log("Testing Thesys Integration (Isolated)...");

  const apiKey = process.env.THESYS_API_KEY;
  const baseURL =
    process.env.THESYS_BASE_URL || "https://api.thesys.dev/v1/embed";

  console.log("API Key present:", !!apiKey);
  console.log("Base URL:", baseURL);

  if (!apiKey) {
    console.error("No API Key found. Check .env file.");
    return;
  }

  const thesysProvider = createOpenAICompatible({
    name: "thesys",
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const model = thesysProvider("c1/openai/gpt-5/v-20251230");

  try {
    const result = await generateText({
      model,
      prompt: "Hello! If you can read this, reply with 'Thesys is online'.",
    });

    console.log("\nResponse:\n", result.text);
  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testThesys();
