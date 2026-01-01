import { createOllama } from "ollama-ai-provider-v2";
import { streamText } from "ai";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

const model = ollama("tinyllama:latest");

async function main() {
  console.log("Testing streaming...");
  try {
    const result = streamText({
      model,
      prompt: "Count to 5 please.",
    });

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log("\nStream complete.");
  } catch (error) {
    console.error("Streaming Error:", error);
  }
}

main();
