import "dotenv/config";
import { generateImageWithHuggingFace } from "../src/lib/ai/image/generate-image";

async function verify() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error("No API key found in env!");
    process.exit(1);
  }

  console.log("Testing generateImageWithHuggingFace...");
  try {
    const res = await generateImageWithHuggingFace({
      prompt: "A cyberpunk cat",
    });
    console.log("Success!");
    console.log("Number of images:", res.images.length);
    console.log("MimeType:", res.images[0].mimeType);
    console.log("Base64 Length:", res.images[0].base64.length);
  } catch (error) {
    console.error("Verification Failed:", error);
    process.exit(1);
  }
}

verify();
