#!/usr/bin/env tsx
import "dotenv/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Use Values from force-deploy.ts which confirmed working
const API_BASE = "https://ctrl.sliplane.io/v0";
// Fallback to the known working token if env var missing
const TOKEN = process.env.TOKEN || "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const PUBLIC_DOMAIN = "https://nabdai.sliplane.app";

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "X-Organization-ID": ORG_ID,
  };

  console.log("🔍 Listing Services...");

  const listResp = await fetch(`${API_BASE}/projects/${PROJECT_ID}/services`, {
    headers,
  });
  if (!listResp.ok) {
    console.error("List failed", await listResp.text());
    process.exit(1);
  }
  const services = await listResp.json();

  // Look for NabdAI
  let appService = services.find(
    (s: any) => s.name === "NabdAI" || s.name === "NabdAI-App",
  );

  // Fallback: try finding any service that isn't the DB
  if (!appService) {
    console.log("Could not find exact match 'NabdAI'. Checking all names...");
    appService = services.find(
      (s: any) => !s.name.includes("Postgres") && !s.name.includes("postgres"),
    );
  }

  if (!appService) {
    console.error("❌ Could not determine App Service.");
    console.log(
      "Available services:",
      services.map((s) => s.name),
    );
    process.exit(1);
  }

  const SERVICE_ID = appService.id;
  console.log(`✅ Found Target Service: ${appService.name} (${SERVICE_ID})`);

  // 2. Get Current Config for environment merging
  const currentEnv = appService.env || [];

  // 3. Prepare Updates
  const updates = [
    { key: "AUTH_URL", value: PUBLIC_DOMAIN, secret: false },
    { key: "NEXTAUTH_URL", value: PUBLIC_DOMAIN, secret: false },
    { key: "NEXT_PUBLIC_APP_URL", value: PUBLIC_DOMAIN, secret: false },
    { key: "AUTH_TRUST_HOST", value: "true", secret: false },
  ];

  // Merge updates
  const newEnv = [...currentEnv];
  updates.forEach((up) => {
    const idx = newEnv.findIndex((e: any) => e.key === up.key);
    if (idx >= 0) {
      newEnv[idx] = up;
    } else {
      newEnv.push(up);
    }
  });

  // CRITICAL: Include all required fields for Sliplane Update
  const payload = {
    name: appService.name,
    image: appService.image,
    cmd: appService.cmd,
    env: newEnv,
    deployment: appService.deployment, // Required by API
    volumes: appService.volumes,
    network: appService.network,
    healthcheck: appService.healthcheck,
  };

  console.log("🚀 Updating Service Environment...");
  const patchResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    },
  );

  if (!patchResp.ok) {
    console.error("❌ Update Failed:", await patchResp.text());
    process.exit(1);
  }

  console.log("✅ Environment Updated! Triggering Deploy...");

  // 4. Trigger Deploy
  const deployResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deploy`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    },
  );

  if (deployResp.ok) {
    console.log("✅ Deployment Triggered!");
  } else {
    console.error("❌ Deploy Trigger Failed:", await deployResp.text());
  }
}

main();
