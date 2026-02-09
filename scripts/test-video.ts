import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
});

async function testVideoGeneration() {
  const prompt = "A red ball bouncing on a wooden floor, simple animation";
  console.log("Starting video generation test...");
  console.log("Model: veo-3.1-generate-preview");
  console.log("Prompt:", prompt);

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt,
      config: {
        numberOfVideos: 1,
      },
    });

    console.log("Operation started. Name:", operation.name);
    console.log("Initial state:", JSON.stringify(operation, null, 2));

    let attempts = 0;
    const maxAttempts = 20;

    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));

      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });

      if (operation.error) {
        console.error(
          "Operation reported an error:",
          JSON.stringify(operation.error, null, 2),
        );
        break;
      }

      if (operation.metadata) {
        console.log(
          "Metadata progress:",
          JSON.stringify(operation.metadata, null, 2),
        );
      }
    }

    if (operation.done) {
      console.log("Operation completed!");
      console.log(
        "Final Response Structure:",
        JSON.stringify(operation.response, null, 2),
      );

      if (operation.response?.generatedVideos) {
        console.log(
          "Success! Found",
          operation.response.generatedVideos.length,
          "videos.",
        );
        operation.response.generatedVideos.forEach((vid, i) => {
          console.log(
            `Video ${i}:`,
            vid.video?.uri || "No URI",
            vid.video?.mimeType || "No MIME",
          );
          console.log(
            `Bytes present:`,
            !!(
              vid.video?.videoBytes ||
              vid.video?.base64 ||
              vid.videoBytes ||
              vid.base64
            ),
          );
        });
      } else {
        console.log("Operation done but no generatedVideos found in response.");
      }
    } else {
      console.log("Timed out or error occurred before completion.");
    }
  } catch (err) {
    console.error("SDK Call failed spectacularly:");
    console.error(err);
    if ((err as any).response) {
      console.error(
        "API Response Data:",
        JSON.stringify((err as any).response, null, 2),
      );
    }
  }
}

testVideoGeneration();
