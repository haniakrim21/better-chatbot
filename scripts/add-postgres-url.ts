#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function addDatabaseUrl() {
  console.log("🔧 Adding POSTGRES_URL to NabdAI service...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // Construct database URL using internal domain
  // Sliplane uses internal networking: postgres-ms05.internal
  // Default credentials are typically postgres:postgres
  const dbUrl =
    "postgres://postgres:postgres@postgres-ms05.internal:5432/postgres";
  console.log("Database URL:", dbUrl);

  // Get current app service config
  console.log("\n1. Fetching NabdAI service config...");
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

  // Add POSTGRES_URL to environment
  const updatedEnv = [
    ...currentEnv.filter(
      (e: any) => e.key !== "POSTGRES_URL" && e.key !== "DATABASE_URL",
    ),
    { key: "POSTGRES_URL", value: dbUrl, secret: false },
  ];

  console.log("\n2. Updating NabdAI service with POSTGRES_URL...");
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

  console.log("   ✅ POSTGRES_URL added successfully!");
  console.log("\n✅ Done! Database URL configured.");
  console.log(
    "📝 POSTGRES_URL: postgres://postgres:postgres@postgres-ms05.internal:5432/postgres",
  );
  console.log("\n🚀 Now trigger a redeploy to apply the changes.");
}

addDatabaseUrl().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
