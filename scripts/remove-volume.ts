#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";
const VOLUME_ID = "volume_1u9vi21ktoh3";

async function removeVolumeDirectly() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("🔧 ATTEMPTING TO REMOVE VOLUME\n");

  // Try 1: DELETE volume endpoint
  console.log("Attempt 1: DELETE /volumes/{id}");
  const deleteResp = await fetch(`${API_BASE}/volumes/${VOLUME_ID}`, {
    method: "DELETE",
    headers,
  });

  console.log(`   Status: ${deleteResp.status}`);

  if (deleteResp.status === 200 || deleteResp.status === 204) {
    console.log("   ✅ Volume deleted successfully!");
    return true;
  }

  const deleteError = await deleteResp.text();
  console.log(`   ❌ Failed: ${deleteError}\n`);

  // Try 2: Detach volume from service
  console.log("Attempt 2: PATCH service with empty volumes array");

  // First get current service config
  const getResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );
  const currentService = await getResp.json();

  // Update with explicit empty volumes
  const updatePayload = {
    ...currentService,
    volumes: [],
    env: currentService.env || [],
  };

  // Remove read-only fields
  delete updatePayload.id;
  delete updatePayload.createdAt;
  delete updatePayload.status;
  delete updatePayload.projectId;
  delete updatePayload.serverId;

  const patchResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(updatePayload),
    },
  );

  console.log(`   Status: ${patchResp.status}`);

  if (!patchResp.ok) {
    const patchError = await patchResp.text();
    console.log(`   ❌ Failed: ${patchError}\n`);
  } else {
    const result = await patchResp.json();
    console.log(`   Volumes after update: ${result.volumes?.length || 0}`);

    if (result.volumes && result.volumes.length > 0) {
      console.log("   ⚠️  Volume still attached");
      return false;
    } else {
      console.log("   ✅ Volume detached!");
      return true;
    }
  }

  // Try 3: Check if there's a specific detach endpoint
  console.log("\nAttempt 3: Looking for detach endpoint");
  console.log("   Trying: DELETE /services/{id}/volumes/{volumeId}");

  const detachResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/volumes/${VOLUME_ID}`,
    {
      method: "DELETE",
      headers,
    },
  );

  console.log(`   Status: ${detachResp.status}`);

  if (detachResp.status === 200 || detachResp.status === 204) {
    console.log("   ✅ Volume detached successfully!");
    return true;
  }

  const detachError = await detachResp.text();
  console.log(`   Response: ${detachError}`);

  return false;
}

removeVolumeDirectly().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
