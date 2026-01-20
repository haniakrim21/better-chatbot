#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_2zb0sf2dfyi9";

async function checkService() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
  };

  const response = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ FAILED: ${response.status} - ${text}`);
    process.exit(1);
  }

  const service = await response.json();
  console.log(JSON.stringify(service, null, 2));
}

checkService();
