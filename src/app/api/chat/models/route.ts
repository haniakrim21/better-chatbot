import { customModelProvider } from "lib/ai/models";

export const GET = async () => {
  let ollamaModels: any[] = [];
  try {
    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/api";
    const response = await fetch(`${ollamaBaseUrl}/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      ollamaModels = data.models.map((model: any) => ({
        name: model.model,
        isToolCallUnsupported: true, // Optimistic assumption for now
        isImageInputUnsupported: true, // Optimistic assumption for now
        supportedFileMimeTypes: [],
      }));
    }
  } catch {
    // console.warn("Failed to fetch Ollama models (skipping dynamic models)", error);
  }

  const staticModels = customModelProvider.modelsInfo.map((providerInfo) => {
    if (providerInfo.provider === "ollama") {
      // If we successfully fetched dynamic models, use them. Otherwise fallback to static.
      if (ollamaModels.length > 0) {
        return {
          ...providerInfo,
          models: ollamaModels,
        };
      }
    }
    return providerInfo;
  });

  return Response.json(
    staticModels.sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    }),
  );
};
