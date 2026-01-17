#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const DB_SERVICE_ID = "service_z1a762s8lvta"; // Postgres-Ms05

async function getDatabaseCredentials() {
  console.log("🔍 Fetching database credentials from Sliplane...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${DB_SERVICE_ID}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch database: ${response.status}`);
  }

  const dbService = await response.json();

  console.log("Database Service Full Details:");
  console.log("==============================\n");
  console.log(JSON.stringify(dbService, null, 2));

  // Look for environment variables that might contain credentials
  if (dbService.env && dbService.env.length > 0) {
    console.log("\n\nDatabase Environment Variables:");
    console.log("===============================");
    dbService.env.forEach((e: any) => {
      console.log(`${e.key}: ${e.secret ? "[SECRET - HIDDEN]" : e.value}`);
    });
  }
}

getDatabaseCredentials().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
