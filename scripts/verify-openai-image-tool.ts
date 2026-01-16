import { openaiImageTool } from "../src/lib/ai/tools/image";
import dotenv from "dotenv";

dotenv.config();

async function verify() {
  console.log("Verifying openaiImageTool...");
  const context = {
    messages: [{ role: "user", content: "Generate a pixel art of a cat" }],
    abortSignal: undefined,
  };

  try {
    // @ts-ignore
    const result = await openaiImageTool.execute({ mode: "create" }, context);
    console.log("Tool Execution Result Keys:", Object.keys(result));
    if (result.images && result.images.length > 0) {
      console.log("✅ Image generated successfully!");
      console.log("Image URL:", result.images[0].url);
    } else {
      console.log("❌ No images generated.");
      console.log("Guide message:", result.guide);
    }
  } catch (e) {
    console.error("❌ Error executing tool:", e);
  }
}

verify();
