#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const DB_SERVICE_ID = "service_z1a762s8lvta"; // Postgres-Ms05

async function getFullDatabaseConfig() {
  console.log("🔍 Fetching complete database configuration...\n");

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

  console.log("Database Service Details:");
  console.log("========================\n");
  console.log("Name:", dbService.name);
  console.log("ID:", dbService.id);
  console.log("Status:", dbService.status);
  console.log("\nNetwork Configuration:");
  console.log("  Internal Domain:", dbService.network?.internalDomain);
  console.log("  Managed Domain:", dbService.network?.managedDomain);
  console.log("  Protocol:", dbService.network?.protocol);
  console.log("  Public:", dbService.network?.public);

  console.log("\nDeployment:");
  console.log("  Image:", dbService.deployment?.url);

  console.log("\nEnvironment Variables:", dbService.env?.length || 0);
  if (dbService.env && dbService.env.length > 0) {
    dbService.env.forEach((e: any) => {
      console.log(`  - ${e.key}: ${e.secret ? "[SECRET]" : e.value}`);
    });
  }

  // Try to construct connection strings
  console.log("\n\nPossible Connection Strings:");
  console.log("===========================");

  const internalDomain = dbService.network?.internalDomain;
  const managedDomain = dbService.network?.managedDomain;

  if (internalDomain) {
    console.log("\n1. Internal (recommended):");
    console.log(
      `   postgres://postgres:postgres@${internalDomain}:5432/postgres`,
    );
  }

  if (managedDomain) {
    console.log("\n2. Public (if internal fails):");
    console.log(
      `   postgres://postgres:postgres@${managedDomain}:5432/postgres`,
    );
  }
}

getFullDatabaseConfig().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
