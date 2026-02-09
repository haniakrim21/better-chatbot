"use server";
import { GoogleGenAI } from "@google/genai";
import logger from "logger";

export type GeneratedImageResult = {
  images: {
    base64: string;
    mimeType: string;
  }[];
};

export const generateImageWithImagen = async (
  prompt: string,
): Promise<GeneratedImageResult> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  console.log("[Imagen] Generating image with prompt:", prompt);

  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    console.log("[Imagen] Raw Response Keys:", Object.keys(response));

    // Handle standard SDK response structure
    const images =
      (response as any).images || (response as any).generatedImages || [];

    if (images.length > 0) {
      return {
        images: images
          .map((img: any) => {
            // Try all possible property names seen in docs and testing
            const b64 =
              img.imageBytes ||
              img.image?.base64 ||
              img.image?.imageBytes ||
              img.base64;
            if (!b64) return null;

            return {
              base64: b64,
              mimeType: "image/png",
            };
          })
          .filter((img: any) => img !== null),
      };
    }

    logger.warn("[Imagen] No images found in response");
    return { images: [] };
  } catch (err) {
    logger.error("[Imagen] Generation failed:", err);
    if ((err as any).response) {
      logger.error(
        "[Imagen] API Error Response:",
        JSON.stringify((err as any).response, null, 2),
      );
    }
    throw err;
  }
};
