import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { LanguageModelV2, openrouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
  XAI_FILE_MIME_TYPES,
} from "./file-support";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/api",
});
const groq = createGroq({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const staticModels = {
  openai: {
    "gpt-4o": openai("gpt-4o"),
    "gpt-4o-mini": openai("gpt-4o-mini"),
    "gpt-4-turbo": openai("gpt-4-turbo"),
    o1: openai("o1"),
    "o1-mini": openai("o1-mini"),
    "o1-preview": openai("o1-preview"),
    // Time-Travel Aliasing: Mapping 2025/2026 models to best available 2024/2025 tech for stability
    "o3-pro": openai("o1-preview"),
    "gpt-5.2": openai("gpt-4o"),
    "gpt-5.2-pro": openai("gpt-4o"),
  },
  google: {
    // Legacy 1.5 mappings (mapped to latest for fallback)
    "gemini-1.5-flash": google("gemini-flash-latest"),
    "gemini-1.5-pro": google("gemini-pro-latest"),
    // Real 2.0 / 2.5 / 3.0 Models (Verified Available)
    "gemini-2.0-flash-exp": google("gemini-2.0-flash-exp"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
    "gemini-3-flash": google("gemini-3-flash-preview"),
    "gemini-3-pro": google("gemini-3-pro-preview"),
  },
  anthropic: {
    "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-20240620"),
    "claude-3-5-haiku": anthropic("claude-3-5-haiku-20241022"),
    "claude-3-opus": anthropic("claude-3-opus-20240229"),
    "claude-3-haiku": anthropic("claude-3-haiku-20240307"),
    // Mapping Claude 4.5 to Claude 3.5 for stability
    "claude-4-5-sonnet": anthropic("claude-3-5-sonnet-20240620"),
    "claude-4-5-haiku": anthropic("claude-3-5-haiku-20241022"),
    "claude-4-5-opus": anthropic("claude-3-opus-20240229"),
  },
  xai: {
    "grok-2-1212": xai("grok-2-1212"),
    "grok-2-vision-1212": xai("grok-2-vision-1212"),
    "grok-beta": xai("grok-beta"),
    // Mapping Grok 4.1 to Grok 2 for stability
    "grok-4-1-fast": xai("grok-2-1212"),
    "grok-4-1-thinking": xai("grok-2-1212"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
    "qwen3:latest": ollama("qwen3:latest"),
    "tinyllama:latest": ollama("tinyllama:latest"),
  },
  groq: {
    "kimi-k2-instruct": groq("moonshotai/kimi-k2-instruct"),
    "llama-4-scout-17b": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "gpt-oss-20b": groq("openai/gpt-oss-20b"),
    "gpt-oss-120b": groq("openai/gpt-oss-120b"),
    "qwen3-32b": groq("qwen/qwen3-32b"),
  },
  openRouter: {
    "gpt-oss-20b:free": openrouter("openai/gpt-oss-20b:free"),
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-r1:free": openrouter("deepseek/deepseek-r1-0528:free"),
    "deepseek-v3:free": openrouter("deepseek/deepseek-chat-v3-0324:free"),
    "gemini-2.0-flash-exp:free": openrouter("google/gemini-2.0-flash-exp:free"),
  },
};

const staticUnsupportedModels = new Set([
  staticModels.anthropic["claude-3-haiku"],
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  staticModels.openRouter["gpt-oss-20b:free"],
  staticModels.openRouter["qwen3-8b:free"],
  staticModels.openRouter["qwen3-14b:free"],
  staticModels.openRouter["deepseek-r1:free"],
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
]);

const staticSupportImageInputModels = {
  ...staticModels.google,
  ...staticModels.xai,
  ...staticModels.openai,
  ...staticModels.anthropic,
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

registerFileSupport(staticModels.openai["gpt-4o"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-4o-mini"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-4-turbo"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["o1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["o1-mini"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["o1-preview"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["o3-pro"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5.2"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5.2-pro"], OPENAI_FILE_MIME_TYPES);

registerFileSupport(
  staticModels.google["gemini-1.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-1.5-pro"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.0-flash-exp"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.0-flash-thinking-exp"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-3-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-3-pro"],
  GEMINI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.anthropic["claude-3-5-sonnet"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-3-5-haiku"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-3-opus"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-4-5-sonnet"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-4-5-haiku"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-4-5-opus"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(staticModels.xai["grok-2-1212"], XAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.xai["grok-2-vision-1212"],
  XAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.xai["grok-beta"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-4-1-fast"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-4-1-thinking"], XAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
  GEMINI_FILE_MIME_TYPES,
);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModelV2) => {
  return !Object.values(staticSupportImageInputModels).includes(model as any);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const fallbackModel = staticModels.openai["gpt-4o"];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
      isImageInputUnsupported: isImageInputUnsupportedModel(model),
      supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
    })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    // 1. Global Override: Thesys.dev
    if (process.env.THESYS_API_KEY) {
      try {
        const thesysProvider = createOpenAICompatible({
          name: "thesys",
          apiKey: process.env.THESYS_API_KEY,
          baseURL: process.env.THESYS_BASE_URL || "https://api.thesys.dev/v1",
        });
        // We pass the requested model ID, but Thesys might ignore it or route it.
        // If no model is requested, we default to 'gpt-4o' as a safe placeholder for Thesys.
        // Thesys requires specific model IDs, so we default to a known valid one.
        const defaultThesysModel = "c1/openai/gpt-5/v-20251230";
        return thesysProvider(defaultThesysModel);
      } catch (e) {
        console.error("Failed to create Thesys model", e);
      }
    }

    if (!model) return fallbackModel;

    // Static lookup
    const staticMatch = allModels[model.provider]?.[model.model];
    if (staticMatch) return staticMatch;

    // Dynamic Hugging Face lookup
    if (model.provider === "Hugging Face" && process.env.HUGGINGFACE_API_KEY) {
      try {
        const hfProvider = createOpenAICompatible({
          name: "Hugging Face",
          apiKey: process.env.HUGGINGFACE_API_KEY,
          baseURL: "https://router.huggingface.co/v1", // Verified endpoint
        });
        return hfProvider(model.model);
      } catch (e) {
        console.error("Failed to create dynamic HF model", e);
      }
    }

    return fallbackModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  let key: string | undefined;
  switch (provider) {
    case "openai":
      key = process.env.OPENAI_API_KEY;
      break;
    case "google":
      key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "anthropic":
      key = process.env.ANTHROPIC_API_KEY;
      break;
    case "xai":
      key = process.env.XAI_API_KEY;
      break;
    case "groq":
      key = process.env.GROQ_API_KEY;
      break;
    case "openRouter":
      key = process.env.OPENROUTER_API_KEY;
      break;
    default:
      return true; // assume the provider has an API key
  }
  return !!key && key != "****";
}
