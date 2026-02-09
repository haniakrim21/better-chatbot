import {
  ImagePart,
  ModelMessage,
  ToolResultPart,
  tool as createTool,
} from "ai";
import { generateImageWithOpenAI } from "lib/ai/image/generate-image";
import { generateImageWithImagen } from "lib/ai/image/generate-image-new";
import { serverFileStorage } from "lib/file-storage";

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
    const { messages } = context;
    try {
      // Simplified Logic: Just get the prompt.
      // We no longer rely on complex history processing for Imagen 3/4 as it accepts a single prompt.

      let finalPrompt = "";

      // 1. Try to get prompt from the tool arguments if we add them later (currently empty schema)
      // 2. Fallback: Get the last user message text
      const lastUserMsg = messages
        .slice()
        .reverse()
        .find((m: any) => m.role === "user");

      if (lastUserMsg) {
        if (typeof lastUserMsg.content === "string") {
          finalPrompt = lastUserMsg.content;
        } else if (Array.isArray(lastUserMsg.content)) {
          finalPrompt = lastUserMsg.content
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join(" ");
        }
      }

      if (!finalPrompt) {
        // As a last resort, try to infer from the assistant's previous thought or context if absolutely needed,
        // but for now, we'll return a helpful error to the user if no prompt is found.
        return {
          images: [],
          mode,
          model: "imagen-4.0-generate-001",
          guide:
            "I couldn't find a clear description of the image you want me to generate. Please provide a description.",
        };
      }

      console.log("[NanoBananaTool] Final Prompt:", finalPrompt);
      const images = await generateImageWithImagen(finalPrompt);
      console.log(
        "[NanoBananaTool] Images Result Count:",
        images.images.length,
      );

      const resultImages = await Promise.all(
        images.images.map(async (image) => {
          try {
            const uploadedImage = await serverFileStorage.upload(
              Buffer.from(image.base64, "base64"),
              {
                contentType: "image/png",
                filename: `image-${Date.now()}.png`,
              },
            );
            return {
              url: uploadedImage.sourceUrl,
              mimeType: "image/png",
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

      return {
        images: resultImages,
        mode,
        model: "imagen-4.0-generate-001",
        guide:
          resultImages.length > 0
            ? "The image has been successfully generated and is now displayed above."
            : "I apologize, but the image generation was not successful.",
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
      let imageUrl = `data:image/png;base64,${base64Image}`;
      try {
        const uploadedImage = await serverFileStorage.upload(
          Buffer.from(base64Image, "base64"),
          {
            contentType: "image/png",
            filename: `image-${Date.now()}.png`,
          },
        );
        imageUrl = uploadedImage.sourceUrl;
      } catch (e) {
        logger.error("Image upload failed, falling back to base64", e);
      }

      return {
        images: [{ url: imageUrl, mimeType: "image/png" }],
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
  return result.images
    .filter((image) => !image.url.startsWith("data:"))
    .map((image) => ({
      type: "image",
      image: image.url,
      mediaType: image.mimeType,
    }));
}
