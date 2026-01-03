import "dotenv/config";
import { HfInference } from "@huggingface/inference";

async function testSDK() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error("HUGGINGFACE_API_KEY is missing");
    return;
  }

  const hf = new HfInference(apiKey);

  const imageModel = "prompthero/openjourney";
  const embeddingModel = "sentence-transformers/all-MiniLM-L6-v2";

  // Test 1: Image Generation
  console.log(`\n--- Test 1: Image Generation (${imageModel}) ---`);
  try {
    const blob = (await hf.textToImage({
      model: imageModel,
      inputs: "A futuristic city at sunset",
      parameters: { num_inference_steps: 4 },
    })) as unknown as Blob;
    console.log("Success! Blob type:", blob.type, "Size:", blob.size);
  } catch (e) {
    console.error("Image Gen Failed:", e);
  }

  // Test 2: Embeddings
  console.log(`\n--- Test 2: Embeddings (${embeddingModel}) ---`);
  try {
    const output = await hf.featureExtraction({
      model: embeddingModel,
      inputs: "This is a test sentence.",
    });
    console.log(
      "Success! Output type:",
      Array.isArray(output) ? "Array" : typeof output,
    );
    if (Array.isArray(output)) console.log("Length:", output.length);
  } catch (e) {
    console.error("Embeddings Failed:", e);
  }

  // Test 3: Chat Completion
  console.log(
    `\n--- Test 3: Chat Completion (microsoft/Phi-3-mini-4k-instruct) ---`,
  );
  try {
    const chatRes = await hf.chatCompletion({
      model: "microsoft/Phi-3-mini-4k-instruct",
      messages: [{ role: "user", content: "Hello!" }],
      max_tokens: 20,
    });
    console.log("Chat Success:", chatRes.choices[0].message.content);
  } catch (e) {
    console.error("Chat Failed:", e);
  }
}

testSDK();
