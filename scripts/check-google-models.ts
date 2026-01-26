import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Fetching available models...");
    const response = await ai.models.list();
    console.log("Full Response Keys:", Object.keys(response));
    console.log("Full Response:", JSON.stringify(response, null, 2));

    // The response structure might be a paginated list or just an array
    // Adjusting based on standard SDK returns
    const models = (response as any).models || [];

    if (models.length === 0) {
      console.log("No models found.");
    }

    models.forEach((model: any) => {
      console.log(`\nModel: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(
        `Supported Generation Methods: ${model.supportedGenerationMethods?.join(", ")}`,
      );
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
