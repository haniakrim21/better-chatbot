import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function testImageGen() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Attempting to generate image with imagen-4.0-generate-001...");
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: "A futuristic car driving on the moon",
      config: {
        numberOfImages: 1,
      },
    });

    console.log("Full Response Keys:", Object.keys(response));
    console.log("Full Response:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error generating image:", error);
    if ((error as any).response) {
      console.error(
        "API Error Response:",
        JSON.stringify((error as any).response, null, 2),
      );
    }
  }
}

testImageGen();
