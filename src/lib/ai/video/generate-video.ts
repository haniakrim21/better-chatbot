"use server";
import { GoogleGenAI } from "@google/genai";
import logger from "logger";

export type GeneratedVideoResult = {
  videos: {
    base64: string;
    mimeType: string;
  }[];
};

export const generateVideoWithVeo = async (
  prompt: string,
): Promise<GeneratedVideoResult> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  console.log("[Veo] Starting video generation with prompt:", prompt);

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt,
      config: {
        numberOfVideos: 1,
      },
    });

    console.log("[Veo] Operation started:", operation.name);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 * 10 seconds = 300 seconds (5 minutes)

    while (!operation.done && attempts < maxAttempts) {
      console.log(`[Veo] Polling... Attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Video generation timed out after 5 minutes.");
    }

    if (operation.error) {
      throw new Error(`Veo API Error: ${JSON.stringify(operation.error)}`);
    }

    console.log("[Veo] Generation complete!");

    const videos = operation.response?.generatedVideos || [];

    if (videos.length > 0) {
      return {
        videos: (
          await Promise.all(
            videos.map(async (vid: any) => {
              let b64 =
                vid.video?.videoBytes ||
                vid.videoBytes ||
                vid.video?.base64 ||
                vid.base64;

              if (!b64 && vid.video?.uri) {
                console.log(
                  "[Veo] Fetching video bytes from URI:",
                  vid.video.uri,
                );
                try {
                  const fetchUrl = `${vid.video.uri}${vid.video.uri.includes("?") ? "&" : "?"}key=${apiKey}`;
                  const res = await fetch(fetchUrl);
                  if (!res.ok)
                    throw new Error(`Failed to fetch video: ${res.statusText}`);
                  const buffer = await res.arrayBuffer();
                  b64 = Buffer.from(buffer).toString("base64");
                } catch (e) {
                  console.error("[Veo] Error fetching from URI:", e);
                }
              }

              if (!b64) {
                console.warn(
                  "[Veo] Video bytes missing and URI fetch failed or missing",
                );
                return null;
              }

              return {
                base64: b64,
                mimeType: vid.video?.mimeType || "video/mp4",
              };
            }),
          )
        ).filter(
          (vid: any): vid is { base64: string; mimeType: string } =>
            vid !== null,
        ),
      };
    }

    logger.warn("[Veo] No videos found in final response");
    return { videos: [] };
  } catch (err) {
    logger.error("[Veo] Generation failed:", err);
    throw err;
  }
};
