#!/usr/bin/env tsx

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4";

async function investigateFailure() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  console.log("🔍 INVESTIGATING DEPLOYMENT FAILURE\n");

  // Get full service details
  const serviceResp = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );
  const service = await serviceResp.json();

  console.log("Service Configuration:");
  console.log("======================\n");
  console.log(JSON.stringify(service, null, 2));

  // Check if there are any deployment-specific issues
  console.log("\n\nKey Issues to Check:");
  console.log("====================\n");

  // 1. Check volumes
  if (service.volumes && service.volumes.length > 0) {
    console.log("⚠️  FOUND ISSUE: Service has volumes configured:");
    service.volumes.forEach((v: any) => {
      console.log(`   - ${v.name}: ${v.mountPath}`);
    });
    console.log(
      "\n   This volume (postgres-data-Ms05) is for the DATABASE service,",
    );
    console.log("   NOT for the NabdAI application service!");
    console.log(
      "   🔧 FIX: Remove this volume from the NabdAI service configuration.",
    );
  }

  // 2. Check deployment config
  if (!service.deployment) {
    console.log("❌ No deployment configuration found!");
  } else {
    console.log("✅ Deployment configuration exists");
    if (!service.deployment.url) {
      console.log("   ❌ No repository URL");
    }
    if (!service.deployment.dockerfilePath) {
      console.log("   ❌ No Dockerfile path");
    }
  }

  // 3. Check environment variables
  console.log(`\n${service.env?.length || 0} environment variables configured`);

  return service;
}

investigateFailure().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
