import { ModelMessage, experimental_generateImage } from "ai";
import { openai, xai } from "lib/ai/models";

type GenerateImageOptions = {
  messages?: ModelMessage[];
  prompt: string;
  abortSignal?: AbortSignal;
};

type GeneratedImage = {
  base64: string;
  mimeType?: string;
};

export type GeneratedImageResult = {
  images: GeneratedImage[];
};

export async function generateImageWithOpenAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  console.log("Generating image with options:", options);
  return experimental_generateImage({
    model: openai.image("dall-e-3"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => {
        const item: GeneratedImage = {
          base64: Buffer.from(v.uint8Array).toString("base64"),
          mimeType: v.mediaType,
        };
        return item;
      }),
    };
  });
}

export async function generateImageWithXAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return experimental_generateImage({
    model: xai.image("grok-2-image"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => ({
        base64: Buffer.from(v.uint8Array).toString("base64"),
        mimeType: v.mediaType,
      })),
    };
  });
}

// This file is kept for backward compatibility if needed, but `generateImageWithNanoBanana` is deprecated.
export const generateImageWithNanoBanana = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  throw new Error(
    "Deprecated. Use generateImageWithImagen in generate-image-new.ts",
  );
};
