#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const DB_SERVICE_ID = "service_z1a762s8lvta"; // Postgres-Ms05

async function getFullDatabaseDetails() {
  console.log("🔍 Fetching complete database service details...\n");

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

  console.log("Full database service object:");
  console.log(JSON.stringify(dbService, null, 2));
}

getFullDatabaseDetails().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
