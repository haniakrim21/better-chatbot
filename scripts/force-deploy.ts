#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

async function deploy() {
  console.log("🚀 Triggering Deployment for NabdAI...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deploy`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({}), // Fix: Send empty body
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ FAILED: ${response.status} - ${text}`);
    if (response.status === 400 && text.includes("already")) {
      console.log("⚠️ Deployment likely already in progress.");
    }
    process.exit(1);
  }

  console.log("✅ Deployment Triggered Successfully!");
}

deploy();
