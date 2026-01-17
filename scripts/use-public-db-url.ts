#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function updateToPublicDatabaseUrl() {
  console.log("🔧 Updating to public database URL...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // Use public domain instead of internal
  const dbUrl =
    "postgres://postgres:postgres@postgres-ms05.sliplane.app:5432/postgres";
  console.log("New Database URL:", dbUrl);

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

  // Update POSTGRES_URL
  const updatedEnv = [
    ...currentEnv.filter(
      (e: any) => e.key !== "POSTGRES_URL" && e.key !== "DATABASE_URL",
    ),
    { key: "POSTGRES_URL", value: dbUrl, secret: false },
  ];

  console.log("\n2. Updating POSTGRES_URL to use public domain...");
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

  console.log("   ✅ POSTGRES_URL updated successfully!");
  console.log("\n✅ Done! Using public database URL.");
  console.log(
    "📝 POSTGRES_URL: postgres://postgres:postgres@postgres-ms05.sliplane.app:5432/postgres",
  );
}

updateToPublicDatabaseUrl().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
