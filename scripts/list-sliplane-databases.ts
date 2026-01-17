#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

async function listDatabases() {
  console.log("🔍 Checking for PostgreSQL databases in project...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // List all services in the project
  const response = await fetch(`${API_BASE}/projects/${PROJECT_ID}/services`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status}`);
  }

  const services = await response.json();

  console.log(`Total services: ${services.length}\n`);

  for (const service of services) {
    console.log(`\n📦 Service: ${service.name}`);
    console.log(`   ID: ${service.id}`);
    console.log(`   Type: ${service.deployment?.type || "unknown"}`);

    if (
      service.deployment?.type === "postgres" ||
      service.name.toLowerCase().includes("postgres")
    ) {
      console.log(`   ✅ This is a PostgreSQL database!`);

      // Try to get connection details
      if (service.env) {
        const dbUrl = service.env.find(
          (e: any) => e.key === "DATABASE_URL" || e.key === "POSTGRES_URL",
        );
        if (dbUrl) {
          console.log(`   Connection: ${dbUrl.value.substring(0, 30)}...`);
        }
      }
    }
  }
}

listDatabases().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
