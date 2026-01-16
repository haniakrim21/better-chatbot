import {
  FilePart,
  ImagePart,
  ModelMessage,
  ToolResultPart,
  tool as createTool,
} from "ai";
import {
  generateImageWithNanoBanana,
  generateImageWithOpenAI,
} from "lib/ai/image/generate-image";
import { serverFileStorage } from "lib/file-storage";
import { safe } from "ts-safe";
import { z } from "zod";
import { ImageToolName } from "..";
import logger from "logger";

import { toAny } from "lib/utils";

export type ImageToolResult = {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  guide?: string;
  model: string;
};

const imageToolParameters = z.object({
  mode: z
    .enum(["create", "edit", "composite"])
    .optional()
    .describe(
      "Image generation mode: 'create' for new images, 'edit' for modifying existing images, 'composite' for combining multiple images",
    ),
});

export const nanoBananaTool = createTool({
  name: ImageToolName,
  description: `Generate, edit, or composite images based on the conversation context. This tool automatically analyzes recent messages to create images without requiring explicit input parameters. It includes all user-uploaded images from the recent conversation and only the most recent AI-generated image to avoid confusion. Use the 'mode' parameter to specify the operation type: 'create' for new images, 'edit' for modifying existing images, or 'composite' for combining multiple images. Use this when the user requests image creation, modification, or visual content generation.`,
  parameters: imageToolParameters,
  inputSchema: imageToolParameters,
  execute: async ({ mode = "create" }: any, context: any) => {
    const { messages, abortSignal } = context;
    try {
      let hasFoundImage = false;

      // Get latest 6 messages and extract only the most recent image for editing context
      // This prevents multiple image references that could confuse the image generation model
      const latestMessages = messages
        .slice(-6)
        .reverse()
        .map((m) => {
          if (m.role != "tool") return m;
          if (hasFoundImage) return m; // Skip if we already found an image
          const fileParts = m.content.flatMap(convertToImageToolPartToFilePart);
          if (fileParts.length === 0) return m;
          hasFoundImage = true; // Mark that we found the most recent image
          return {
            ...m,
            role: "assistant",
            content: fileParts,
          };
        })
        .filter((v) => Boolean(v?.content?.length))
        .reverse() as ModelMessage[];

      const images = await generateImageWithNanoBanana({
        prompt: "",
        abortSignal,
        messages: latestMessages,
      });

      const resultImages = await safe(images.images)
        .map((images) => {
          return Promise.all(
            images.map(async (image) => {
              try {
                const uploadedImage = await serverFileStorage.upload(
                  Buffer.from(image.base64, "base64"),
                  {
                    contentType: image.mimeType,
                  },
                );
                return {
                  url: uploadedImage.sourceUrl,
                  mimeType: image.mimeType,
                };
              } catch (e) {
                logger.error(e);
                logger.info(`upload image failed. using base64`);
                return {
                  url: `data:${image.mimeType};base64,${image.base64}`,
                  mimeType: image.mimeType,
                };
              }
            }),
          );
        })
        .unwrap();

      return {
        images: resultImages,
        mode,
        model: "gemini-2.5-flash-image",
        guide:
          resultImages.length > 0
            ? "The image has been successfully generated and is now displayed above. If you need any edits, modifications, or adjustments to the image, please let me know."
            : "I apologize, but the image generation was not successful. To help me create a better image for you, could you please provide more specific details about what you'd like to see? For example:\n\n• What style are you looking for? (realistic, cartoon, abstract, etc.)\n• What colors or mood should the image have?\n• Are there any specific objects, people, or scenes you want included?\n• What size or format would work best for your needs?\n\nPlease share these details and I'll try generating the image again with your specifications.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
} as any);

export const openaiImageTool = createTool({
  name: ImageToolName,
  description: `Generate, edit, or composite images based on the conversation context. This tool automatically analyzes recent messages to create images without requiring explicit input parameters. It includes all user-uploaded images from the recent conversation and only the most recent AI-generated image to avoid confusion. Use the 'mode' parameter to specify the operation type: 'create' for new images, 'edit' for modifying existing images, or 'composite' for combining multiple images. Use this when the user requests image creation, modification, or visual content generation.`,
  parameters: imageToolParameters,
  inputSchema: imageToolParameters,
  execute: async ({ mode = "create" }: any, context: any) => {
    const { messages, abortSignal } = context;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    let hasFoundImage = false;
    const latestMessages = messages
      .slice(-6)
      .reverse()
      .flatMap((m) => {
        if (m.role != "tool") return m;
        if (hasFoundImage) return m;
        const fileParts = m.content.flatMap(convertToImageToolPartToImagePart);
        if (fileParts.length === 0) return m;
        hasFoundImage = true;
        return [
          {
            role: "user",
            content: fileParts,
          },
          m,
        ] as ModelMessage[];
      })
      .filter((v) => Boolean(v?.content?.length))
      .reverse() as ModelMessage[];

    // Extract the prompt from the latest user message
    const lastUserMessage = latestMessages
      .slice()
      .reverse()
      .find((m) => m.role === "user");

    const promptText = lastUserMessage
      ? typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : lastUserMessage.content
            .filter((c) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ")
      : "";

    // Directly call the image generation API
    const imageResult = await generateImageWithOpenAI({
      prompt: promptText,
      abortSignal,
      messages: latestMessages,
    });

    const base64Image = imageResult.images[0]?.base64;

    if (base64Image) {
      let imageUrl = `data:image/webp;base64,${base64Image}`;
      try {
        const uploadedImage = await serverFileStorage.upload(
          Buffer.from(base64Image, "base64"),
          {
            contentType: "image/webp",
          },
        );
        imageUrl = uploadedImage.sourceUrl;
      } catch (e) {
        logger.error("Image upload failed, falling back to base64", e);
      }

      return {
        images: [{ url: imageUrl, mimeType: "image/webp" }],
        mode,
        model: "dall-e-3",
        guide:
          "The image has been successfully generated and is now displayed above. If you need any edits, modifications, or adjustments to the image, please let me know.",
      };
    }

    return {
      images: [],
      mode,
      model: "dall-e-3",
      guide: "",
    };
  },
} as any);

function convertToImageToolPartToImagePart(part: ToolResultPart): ImagePart[] {
  if (part.toolName !== ImageToolName) return [];
  if (!(toAny(part).output as any)?.value?.images?.length) return [];
  const result = (part.output as any).value as ImageToolResult;
  return result.images.map((image) => ({
    type: "image",
    image: image.url,
    mediaType: image.mimeType,
  }));
}

function convertToImageToolPartToFilePart(part: ToolResultPart): FilePart[] {
  if (part.toolName !== ImageToolName) return [];
  if (!(toAny(part).output as any)?.value?.images?.length) return [];
  const result = (part.output as any).value as ImageToolResult;
  return result.images.map((image) => ({
    type: "file",
    mediaType: image.mimeType!,
    data: image.url,
  }));
}
