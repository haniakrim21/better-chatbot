#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_11h69bcja1cu"; // Postgres-NdZY

async function inspect() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
  };

  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );

  const data = await response.json();
  console.log("📦 Database Service Config:");
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Image: ${data.image}`); // Crucial
  console.log(`   CMD: ${data.cmd}`);
  console.log(`   Env Vars:`, data.env);
}

inspect();
