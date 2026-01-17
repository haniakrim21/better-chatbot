#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";

async function getServiceLogs() {
  console.log("🔍 Fetching service logs from Sliplane...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  // Try to get logs endpoint
  const logsUrl = `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/logs`;

  console.log(`Attempting to fetch logs from: ${logsUrl}\n`);

  const response = await fetch(logsUrl, { headers });

  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch logs: ${response.status}`);
    console.error(`Error response: ${errorText}`);

    // Try alternative endpoints
    console.log("\nTrying alternative endpoint...");
    const altUrl = `${API_BASE}/services/${SERVICE_ID}/logs`;
    const altResponse = await fetch(altUrl, { headers });
    console.log(`Alternative endpoint status: ${altResponse.status}`);

    if (!altResponse.ok) {
      const altError = await altResponse.text();
      console.error(`Alternative endpoint error: ${altError}`);
      return;
    }

    const altLogs = await altResponse.json();
    console.log("\nLogs from alternative endpoint:");
    console.log(JSON.stringify(altLogs, null, 2));
    return;
  }

  const logs = await response.json();
  console.log("\nService Logs:");
  console.log("=============\n");
  console.log(JSON.stringify(logs, null, 2));
}

getServiceLogs().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
