#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";

async function checkEnvPersistence() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("🔍 CHECKING ENVIRONMENT VARIABLE PERSISTENCE\n");
  console.log("Checking every 5 seconds for 30 seconds...\n");

  for (let i = 0; i < 6; i++) {
    const response = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      { headers },
    );

    const service = await response.json();
    const envCount = service.env?.length || 0;

    console.log(`[${i * 5}s] Environment variables: ${envCount}`);

    if (envCount === 0 && i > 0) {
      console.log("   ⚠️  VARIABLES DISAPPEARED!");
      console.log("   This suggests they are being deleted by:");
      console.log("   1. Another script/process");
      console.log("   2. Sliplane auto-configuration");
      console.log("   3. Deployment process clearing them");
    }

    if (i < 5) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("\n📊 Final check...");
  const finalResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );
  const finalService = await finalResp.json();

  console.log(`   Environment variables: ${finalService.env?.length || 0}`);
  console.log(`   Service status: ${finalService.status}`);
  console.log(`   Volumes: ${finalService.volumes?.length || 0}`);

  return finalService;
}

checkEnvPersistence().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
