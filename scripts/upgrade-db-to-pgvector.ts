#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const DB_SERVICE_ID = "service_11h69bcja1cu"; // Postgres-NdZY

async function upgradeDB() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("📦 UPGRADING DATABASE TO PGVECTOR...");

  // 1. Get current config to preserve env/volumes
  const getResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${DB_SERVICE_ID}`,
    { headers },
  );
  const currentService = await getResp.json();

  console.log(`   Current Image: ${currentService.image}`);
  console.log(`   Preserving ${currentService.env?.length || 0} env vars`);
  console.log(`   Preserving ${currentService.volumes?.length || 0} volumes`);

  // 2. Prepare Update Payload
  const updatePayload = {
    // CRITICAL: Change Image to pgvector
    image: "pgvector/pgvector:pg16",

    // Preserve everything else
    name: currentService.name,
    cmd: currentService.cmd,
    env: currentService.env,
    volumes: currentService.volumes,
    network: currentService.network,
    deployment: currentService.deployment,
    healthcheck: currentService.healthcheck,
  };

  // 3. Patch Service
  console.log("\n🚀 Sending Patch Request...");
  const patchResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${DB_SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(updatePayload),
    },
  );

  if (!patchResp.ok) {
    console.error(
      `❌ Failed to patch: ${patchResp.status} - ${await patchResp.text()}`,
    );
    process.exit(1);
  }

  console.log("✅ Service Config Updated to pgvector:pg16");

  // 4. Trigger Deployment
  console.log("\n🔄 Triggering Database Redeployment...");
  const deployResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${DB_SERVICE_ID}/deploy`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({}), // Empty body is key
    },
  );

  if (!deployResp.ok) {
    const errorText = await deployResp.text();
    // If 400 'already in progress', that's fine too as patch triggers deploy?
    if (deployResp.status === 400) {
      console.log(`⚠️ Deployment might be auto-triggered (400): ${errorText}`);
    } else {
      console.error(
        `❌ Deploy Trigger Failed: ${deployResp.status} - ${errorText}`,
      );
    }
  } else {
    console.log("✅ Deployment Triggered!");
  }
}

upgradeDB();
