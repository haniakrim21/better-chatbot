#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function addAllRequiredEnvVars() {
  console.log("🔧 Adding all required environment variables...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // Get current app service config
  console.log("1. Fetching NabdAI service config...");
  const appResponse = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${APP_SERVICE_ID}`,
    { headers },
  );

  if (!appResponse.ok) {
    throw new Error(`Failed to fetch app service: ${appResponse.status}`);
  }

  const appService = await appResponse.json();
  const currentEnv = appService.env || [];
  console.log(`   Current env vars: ${currentEnv.length}`);

  // Add POSTGRES_URL with public domain
  const dbUrl =
    "postgres://postgres:postgres@postgres-ms05.sliplane.app:5432/postgres";

  const envToAdd = [{ key: "POSTGRES_URL", value: dbUrl, secret: false }];

  const updatedEnv = [...currentEnv, ...envToAdd];

  console.log("\n2. Adding POSTGRES_URL...");
  const updatePayload = {
    deployment: appService.deployment,
    env: updatedEnv,
  };

  const updateResponse = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${APP_SERVICE_ID}`,
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

  console.log("   ✅ Environment variables added!");
  console.log("\n✅ Done!");
  console.log(`📝 Total env vars: ${updatedEnv.length}`);
}

addAllRequiredEnvVars().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
