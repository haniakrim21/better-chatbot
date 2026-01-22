#!/usr/bin/env tsx

/**
 * API Status Check Script (Non-Interactive)
 *
 * This script provides a quick status report of all API keys
 * without requiring user interaction.
 */

import * as fs from "fs";
import * as path from "path";

interface APIKeyConfig {
  name: string;
  envVar: string;
  required: boolean;
  description: string;
}

const API_KEYS: APIKeyConfig[] = [
  {
    name: "Better Auth Secret",
    envVar: "BETTER_AUTH_SECRET",
    required: true,
    description: "Authentication secret for Better Auth",
  },
  {
    name: "OpenAI API Key",
    envVar: "OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key for GPT models",
  },
  {
    name: "Google Generative AI API Key",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    required: false,
    description: "Google API key for Gemini models",
  },
  {
    name: "Anthropic API Key",
    envVar: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic API key for Claude models",
  },
  {
    name: "PostgreSQL URL",
    envVar: "POSTGRES_URL",
    required: true,
    description: "PostgreSQL database connection string",
  },
  {
    name: "Exa API Key",
    envVar: "EXA_API_KEY",
    required: false,
    description: "Exa AI API key for web search functionality",
  },
];

function loadEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");

  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  } else if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf-8");
  } else {
    return {};
  }

  const envVars: Record<string, string> = {};
  const lines = envContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    }
  }

  return envVars;
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

function main() {
  console.log("\n🔐 API Configuration Status Report");
  console.log("==================================\n");

  const envVars = loadEnvFile();

  // Check if .env file exists
  const envPath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
    console.log("❌ No .env or .env.local file found!\n");
    console.log(
      "Please create a .env file in the project root with your API keys.\n",
    );
    process.exit(1);
  }

  console.log("📋 Required API Keys:\n");
  const requiredKeys = API_KEYS.filter((k) => k.required);
  let allRequiredSet = true;

  for (const config of requiredKeys) {
    const value = envVars[config.envVar];
    if (value) {
      console.log(`  ✅ ${config.name}`);
      console.log(`     ${config.envVar}: ${maskApiKey(value)}`);
    } else {
      console.log(`  ❌ ${config.name}`);
      console.log(`     ${config.envVar}: NOT SET`);
      allRequiredSet = false;
    }
    console.log();
  }

  console.log("📋 Optional API Keys:\n");
  const optionalKeys = API_KEYS.filter((k) => !k.required);

  for (const config of optionalKeys) {
    const value = envVars[config.envVar];
    if (value) {
      console.log(`  ✅ ${config.name}`);
      console.log(`     ${config.envVar}: ${maskApiKey(value)}`);
    } else {
      console.log(`  ⚠️  ${config.name}`);
      console.log(`     ${config.envVar}: NOT SET`);
    }
    console.log();
  }

  // Check if at least one AI provider is configured
  const aiProviders = [
    "OPENAI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const hasAiProvider = aiProviders.some((key) => envVars[key]);

  console.log("📊 Summary:\n");

  if (!hasAiProvider) {
    console.log("  ⚠️  WARNING: No AI provider API key configured!");
    console.log(
      "     You need at least one of: OpenAI, Google AI, or Anthropic\n",
    );
  }

  if (allRequiredSet && hasAiProvider) {
    console.log("  ✅ All required API keys are configured!");
    console.log("  ✅ At least one AI provider is configured!");
    console.log("  ✅ You're ready to start the application!\n");
    process.exit(0);
  } else {
    console.log("  ❌ Some required configuration is missing.");
    console.log("  ⚠️  Please add the missing API keys to your .env file.\n");
    process.exit(1);
  }
}

main();
