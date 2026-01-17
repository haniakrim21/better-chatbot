import fs from "fs";
import path from "path";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function main() {
  console.log("🚀 Removing OLLAMA_BASE_URL from Sliplane...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    // 1. Fetch Current Config
    console.log("Fetching current Service config...");
    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Failed to fetch service: ${res.status}`);

    const service = (await res.json()) as any;
    const existingEnv = service.env || [];

    // 2. Filter out OLLAMA_BASE_URL
    const newEnv = existingEnv.filter((e: any) => e.key !== "OLLAMA_BASE_URL");

    if (newEnv.length === existingEnv.length) {
      console.log(
        "⚠️ OLLAMA_BASE_URL not found in current config. Nothing to do.",
      );
      return;
    }

    console.log(
      `Removing OLLAMA_BASE_URL... (Remaining keys: ${newEnv.length})`,
    );

    // 3. Update Service
    const updatePayload = {
      deployment: service.deployment,
      env: newEnv,
    };

    const updateRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updatePayload),
      },
    );

    if (!updateRes.ok) {
      throw new Error(
        `Failed to update service: ${updateRes.status} ${await updateRes.text()}`,
      );
    }

    console.log("✅ Successfully removed OLLAMA_BASE_URL!");
    console.log("Service is redeploying.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
