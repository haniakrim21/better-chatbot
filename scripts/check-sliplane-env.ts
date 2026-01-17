#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";

async function checkEnv() {
  console.log("🔍 Checking Sliplane Environment Variables...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch service: ${response.status}`);
  }

  const service = await response.json();
  const envVars = service.env || [];

  console.log(`Total environment variables: ${envVars.length}\n`);

  // Check for critical variables
  const critical = ["POSTGRES_URL", "DATABASE_URL", "OPENAI_API_KEY"];

  console.log("Critical Variables:");
  for (const key of critical) {
    const found = envVars.find((e: any) => e.key === key);
    if (found) {
      console.log(`  ✅ ${key}: ${found.value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${key}: MISSING`);
    }
  }

  console.log("\nAll Variables:");
  for (const env of envVars) {
    const value = env.secret ? "[SECRET]" : env.value;
    console.log(`  - ${env.key}: ${value}`);
  }
}

checkEnv().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
