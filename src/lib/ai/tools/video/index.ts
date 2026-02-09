import { tool as createTool } from "ai";
import { generateVideoWithVeo } from "lib/ai/video/generate-video";
import { serverFileStorage } from "lib/file-storage";

import { z } from "zod";
import { VideoToolName } from "..";
import logger from "logger";

export type VideoToolResult = {
  videos: {
    url: string;
    mimeType?: string;
  }[];
  model: string;
  guide?: string;
};

const videoToolParameters = z.object({
  prompt: z
    .string()
    .optional()
    .describe("A detailed description of the video to generate."),
});

export const videoTool = createTool({
  name: VideoToolName,
  description: `Generate videos based on the conversation context. This tool automatically analyzes recent messages to create videos. Use this when the user requests video creation or visual motion content generation.`,
  parameters: videoToolParameters,
  inputSchema: videoToolParameters,
  execute: async ({ prompt }: any, context: any) => {
    const { messages } = context;
    try {
      let finalPrompt = prompt;

      if (!finalPrompt) {
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
      }

      if (!finalPrompt) {
        return {
          videos: [],
          model: "veo-3.1-generate-preview",
          guide:
            "I couldn't find a clear description of the video you want me to generate. Please provide a description.",
        };
      }

      console.log("[VideoTool] Final Prompt:", finalPrompt);
      const videoResult = await generateVideoWithVeo(finalPrompt);

      const resultVideos = await Promise.all(
        videoResult.videos.map(async (video) => {
          try {
            const uploadedVideo = await serverFileStorage.upload(
              Buffer.from(video.base64, "base64"),
              {
                contentType: "video/mp4",
                filename: `video-${Date.now()}.mp4`,
              },
            );
            return {
              url: uploadedVideo.sourceUrl,
              mimeType: "video/mp4",
            };
          } catch (e) {
            logger.error(e);
            return {
              url: `data:${video.mimeType};base64,${video.base64}`,
              mimeType: video.mimeType,
            };
          }
        }),
      );

      return {
        videos: resultVideos,
        model: "veo-3.1-generate-preview",
        guide:
          resultVideos.length > 0
            ? "The video has been successfully generated and is now displayed above."
            : "I apologize, but the video generation was not successful.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
} as any);
