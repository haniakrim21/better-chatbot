#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import crypto from "node:crypto";

const envPath = path.resolve(process.cwd(), ".env");
const localEnvConfig = dotenv.parse(fs.readFileSync(envPath));

async function workaroundVolume() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("🔧 WORKAROUND: Ignoring volume and forcing deployment\n");

  // Build environment variables
  const envVars = [
    {
      key: "GOOGLE_GENERATIVE_AI_API_KEY",
      value: localEnvConfig.GOOGLE_GENERATIVE_AI_API_KEY,
      secret: true,
    },
    {
      key: "OPENAI_API_KEY",
      value: localEnvConfig.OPENAI_API_KEY,
      secret: true,
    },
    { key: "XAI_API_KEY", value: localEnvConfig.XAI_API_KEY, secret: true },
    {
      key: "ANTHROPIC_API_KEY",
      value: localEnvConfig.ANTHROPIC_API_KEY,
      secret: true,
    },
    {
      key: "OPENROUTER_API_KEY",
      value: localEnvConfig.OPENROUTER_API_KEY,
      secret: true,
    },
    { key: "GROQ_API_KEY", value: localEnvConfig.GROQ_API_KEY, secret: true },
    {
      key: "GROQ_BASE_URL",
      value: localEnvConfig.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      secret: false,
    },
    { key: "FILE_BASED_MCP_CONFIG", value: "true", secret: false },
    {
      key: "POSTGRES_URL",
      value:
        "postgres://postgres:postgres@postgres-ms05.sliplane.app:5432/postgres",
      secret: false,
    },
    {
      key: "BETTER_AUTH_SECRET",
      value:
        localEnvConfig.BETTER_AUTH_SECRET ||
        crypto.randomBytes(32).toString("hex"),
      secret: true,
    },
  ].filter((e) => e.value);

  console.log(
    "Strategy: Keep the volume but ensure environment variables are set",
  );
  console.log(
    "The volume at /var/lib/postgresql/data should not affect the Next.js app\n",
  );

  // Just ensure env vars are set and trigger deployment
  const updatePayload = {
    env: envVars,
    deployment: {
      autoDeploy: true,
      branch: "main",
      dockerContext: "/",
      dockerfilePath: "docker/Dockerfile",
      url: "https://github.com/haniakrim21/better-chatbot",
    },
  };

  console.log("📝 Ensuring environment variables are set...");
  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(updatePayload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Failed: ${response.status}`);
    console.error(`Error: ${errorText}`);
    process.exit(1);
  }

  const result = await response.json();
  console.log(`✅ Environment variables set: ${result.env?.length || 0}`);

  // Trigger deployment
  console.log("\n🚀 Triggering deployment...");
  const deployResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deploy`,
    {
      method: "POST",
      headers,
    },
  );

  if (!deployResp.ok) {
    const deployError = await deployResp.text();
    console.error(`❌ Deployment trigger failed: ${deployResp.status}`);
    console.error(`Error: ${deployError}`);
  } else {
    console.log("✅ Deployment triggered!");
  }

  // Monitor for a bit
  console.log("\n📊 Monitoring deployment (30 seconds)...\n");

  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const statusResp = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      { headers },
    );
    const service = await statusResp.json();

    console.log(`[${(i + 1) * 10}s] Status: ${service.status}`);

    if (service.status === "live") {
      console.log("\n✅ SUCCESS! Service is LIVE!");
      console.log(`🎉 Visit: https://${service.network?.managedDomain}`);
      return true;
    }
  }

  console.log("\n⏱️  Still deploying... Check Sliplane dashboard for progress.");
  return false;
}

workaroundVolume().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
