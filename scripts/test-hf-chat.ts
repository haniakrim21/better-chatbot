import "dotenv/config";
import { type LanguageModel, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

async function testChat() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error("HUGGINGFACE_API_KEY is missing");
    return;
  }

  const hfProvider = createOpenAICompatible({
    name: "Hugging Face",
    apiKey: apiKey,
    baseURL: "https://router.huggingface.co/v1",
  });

  const modelId = "meta-llama/Meta-Llama-3-8B-Instruct";
  console.log(`Testing Chat with ${modelId}...`);

  try {
    const model = hfProvider(modelId);
    const result = await streamText({
      model: model,
      messages: [{ role: "user", content: "Hi, say hello." }],
    });

    console.log("Stream started...");
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log("\nStream finished.");
  } catch (error) {
    console.error("Chat Failed:", error);
  }
}

testChat();
