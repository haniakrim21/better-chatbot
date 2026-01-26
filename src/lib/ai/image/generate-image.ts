import { ModelMessage } from "ai";

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
  throw new Error("Not implemented");
}

export async function generateImageWithXAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  throw new Error("Not implemented");
}

// This file is kept for backward compatibility if needed, but `generateImageWithNanoBanana` is deprecated.
export const generateImageWithNanoBanana = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  throw new Error(
    "Deprecated. Use generateImageWithImagen in generate-image-new.ts",
  );
};
