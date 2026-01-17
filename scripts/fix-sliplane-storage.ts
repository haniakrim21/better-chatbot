#!/usr/bin/env tsx
import "dotenv/config";

const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function updateStorageConfig() {
  console.log("🔧 Updating Sliplane storage configuration...\n");

  const API_BASE = "https://ctrl.sliplane.io/v0";
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // Get current service config
  const getResponse = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );

  if (!getResponse.ok) {
    const error = await getResponse.text();
    throw new Error(`Failed to get service: ${error}`);
  }

  const service = await getResponse.json();
  console.log("Current environment variables:", service.env?.length || 0);

  // Remove FILE_STORAGE_TYPE if it exists, or set it to empty to use default local storage
  const updatedEnv = (service.env || []).filter(
    (env: any) => env.key !== "FILE_STORAGE_TYPE",
  );

  // Update service (must include deployment config)
  const updatePayload = {
    deployment: service.deployment,
    env: updatedEnv,
  };

  const updateResponse = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(updatePayload),
    },
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to update service: ${error}`);
  }

  console.log("✅ Storage configuration updated!");
  console.log("📝 Removed FILE_STORAGE_TYPE to use default local storage");
  console.log("\n🚀 Triggering redeploy...");

  // Trigger redeploy
  const deployResponse = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/redeploy`,
    {
      method: "POST",
      headers,
    },
  );

  if (!deployResponse.ok) {
    const error = await deployResponse.text();
    throw new Error(`Failed to trigger redeploy: ${error}`);
  }

  console.log("✅ Redeploy triggered successfully!");
  console.log("\n⏳ Wait a few minutes and check the deployment status");
}

updateStorageConfig().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
