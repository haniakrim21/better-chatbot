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

async function listModels() {
  try {
    const models = await ai.models.list();
    console.log("Available Models:");
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
