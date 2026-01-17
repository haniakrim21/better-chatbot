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

async function finalForceFix() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("🔧 FINAL FORCE FIX: Explicit config override\n");

  // 1. Define Env Vars Explicitly
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
      value: "https://api.groq.com/openai/v1",
      secret: false,
    },
    { key: "FILE_BASED_MCP_CONFIG", value: "true", secret: false },
    // Use Internal Domain
    {
      key: "POSTGRES_URL",
      value:
        "postgres://postgres:postgres@postgres-ms05.internal:5432/postgres",
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

  // 2. Define Deployment Config Explicitly (Do not rely on fetch)
  const deploymentConfig = {
    autoDeploy: true,
    branch: "main",
    dockerContext: "/",
    dockerfilePath: "docker/Dockerfile",
    url: "https://github.com/haniakrim21/better-chatbot",
  };

  const updatePayload = {
    env: envVars,
    deployment: deploymentConfig,
  };

  console.log("🚀 Sending Full Config Payload...");
  console.log(`   Env Vars: ${envVars.length}`);
  console.log(`   Repo: ${deploymentConfig.url}`);

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
    console.error(`❌ CONFIG UPDATE FAILED: ${response.status}`);
    console.error(errorText);
    process.exit(1);
  }

  const _result = await response.json();
  console.log("✅ Config Updated Successfully!");

  // 3. Trigger Deployment Immediately
  console.log("\n🚀 Triggering Deployment...");
  const deployResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deploy`,
    {
      method: "POST",
      headers,
    },
  );

  if (deployResp.ok) {
    console.log("✅ Deployment Triggered.");
  } else {
    console.error(`❌ Deployment Trigger Failed: ${deployResp.status}`);
  }
}

finalForceFix().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
