#!/usr/bin/env tsx

/**
 * API Setup Verification Script (Local Development Only)
 *
 * This script helps verify that all required API keys have been properly
 * configured in the .env file for LOCAL DEVELOPMENT.
 *
 * NOTE: This is NOT for deployment. For production deployments,
 * configure environment variables through your hosting platform
 * (Vercel, Railway, etc.) instead of using .env files.
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

interface APIKeyConfig {
  name: string;
  envVar: string;
  required: boolean;
  description: string;
  exampleFormat?: string;
}

const API_KEYS: APIKeyConfig[] = [
  {
    name: "Better Auth Secret",
    envVar: "BETTER_AUTH_SECRET",
    required: true,
    description: "Authentication secret for Better Auth",
    exampleFormat: "Generate with: npx @better-auth/cli@latest secret",
  },
  {
    name: "OpenAI API Key",
    envVar: "OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key for GPT models",
    exampleFormat: "sk-***",
  },
  {
    name: "Google Generative AI API Key",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    required: false,
    description: "Google API key for Gemini models",
    exampleFormat: "AI***",
  },
  {
    name: "Anthropic API Key",
    envVar: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic API key for Claude models",
    exampleFormat: "sk-ant-***",
  },
  {
    name: "PostgreSQL URL",
    envVar: "POSTGRES_URL",
    required: true,
    description: "PostgreSQL database connection string",
    exampleFormat: "postgres://user:pass@localhost:5432/dbname",
  },
  {
    name: "Exa API Key",
    envVar: "EXA_API_KEY",
    required: false,
    description: "Exa AI API key for web search functionality",
    exampleFormat: "***",
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

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

async function confirmApiKeyCopied(
  config: APIKeyConfig,
  currentValue?: string,
): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ${config.name}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Environment Variable: ${config.envVar}`);
  console.log(`Description: ${config.description}`);
  if (config.exampleFormat) {
    console.log(`Format: ${config.exampleFormat}`);
  }
  console.log(`Required: ${config.required ? "✅ Yes" : "⚠️  Optional"}`);

  if (currentValue) {
    console.log(`Current Value: ${maskApiKey(currentValue)}`);
    console.log(`✅ API key is already configured!`);

    const update = await question("\nDo you want to update this key? (y/N): ");
    return update.toLowerCase() === "y";
  } else {
    console.log(`Current Value: ❌ Not set`);

    if (config.required) {
      console.log(`\n⚠️  WARNING: This is a required API key!`);
    }

    const confirm = await question(
      "\n✓ Have you copied this API key to your .env file? (y/N): ",
    );
    return confirm.toLowerCase() === "y";
  }
}

async function main() {
  console.log("\n🔐 API Setup Verification Tool (Local Development)");
  console.log("===================================================\n");
  console.log("This tool helps you verify that all required API keys");
  console.log(
    "have been properly configured in your .env file for LOCAL DEVELOPMENT.\n",
  );
  console.log("⚠️  NOTE: This is NOT for deployment. For production,");
  console.log(
    "   configure environment variables through your hosting platform.\n",
  );

  const envVars = loadEnvFile();
  const results: {
    config: APIKeyConfig;
    confirmed: boolean;
    hasValue: boolean;
  }[] = [];

  // Check if .env file exists
  const envPath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
    console.log("⚠️  No .env or .env.local file found!");
    console.log(
      "\nPlease create a .env file in the project root with your API keys.",
    );
    console.log("You can use .env.example as a template if available.\n");

    const createFile = await question(
      "Would you like to create a .env file now? (y/N): ",
    );
    if (createFile.toLowerCase() === "y") {
      const template = API_KEYS.map((key) => `${key.envVar}=`).join("\n");
      fs.writeFileSync(envPath, template);
      console.log(
        "✅ Created .env file. Please add your API keys and run this script again.",
      );
    }

    rl.close();
    return;
  }

  // Check each API key
  for (const config of API_KEYS) {
    const currentValue = envVars[config.envVar];
    const confirmed = await confirmApiKeyCopied(config, currentValue);

    results.push({
      config,
      confirmed,
      hasValue: !!currentValue,
    });
  }

  // Summary
  console.log("\n\n📊 Configuration Summary");
  console.log("========================\n");

  const requiredKeys = results.filter((r) => r.config.required);
  const optionalKeys = results.filter((r) => !r.config.required);

  console.log("Required API Keys:");
  for (const result of requiredKeys) {
    const status = result.hasValue ? "✅" : "❌";
    console.log(`  ${status} ${result.config.name}`);
  }

  console.log("\nOptional API Keys:");
  for (const result of optionalKeys) {
    const status = result.hasValue ? "✅" : "⚠️ ";
    console.log(`  ${status} ${result.config.name}`);
  }

  // Check if at least one AI provider is configured
  const aiProviders = [
    "OPENAI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const hasAiProvider = aiProviders.some((key) => envVars[key]);

  console.log("\n");
  if (!hasAiProvider) {
    console.log("⚠️  WARNING: No AI provider API key configured!");
    console.log("   You need at least one of: OpenAI, Google AI, or Anthropic");
  }

  const allRequiredSet = requiredKeys.every((r) => r.hasValue);

  if (allRequiredSet && hasAiProvider) {
    console.log("✅ All required API keys are configured!");
    console.log("✅ You're ready to start the application with: pnpm dev");
  } else {
    console.log("❌ Some required API keys are missing.");
    console.log(
      "   Please add them to your .env file before starting the application.",
    );
  }

  console.log("\n");
  rl.close();
}

main().catch((error) => {
  console.error("Error:", error);
  rl.close();
  process.exit(1);
});
