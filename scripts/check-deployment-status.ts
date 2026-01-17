import * as dotenv from "dotenv";

dotenv.config();

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function checkDeploymentStatus() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "X-Organization-ID": ORG_ID,
  };

  console.log("🔍 Checking deployment status for NabdAI service...\n");

  // Get service details
  const serviceRes = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );

  if (!serviceRes.ok) {
    throw new Error(
      `Failed to fetch service: ${serviceRes.status} ${await serviceRes.text()}`,
    );
  }

  const service = await serviceRes.json();

  console.log("📊 Service Status:");
  console.log(`  Name: ${service.name}`);
  console.log(`  Status: ${service.status || "N/A"}`);
  console.log(`  Deployment: ${JSON.stringify(service.deployment, null, 2)}`);

  // Get deployments list
  try {
    const deploymentsRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deployments`,
      { headers },
    );

    if (deploymentsRes.ok) {
      const deployments = await deploymentsRes.json();
      console.log("\n📋 Recent Deployments:");
      if (Array.isArray(deployments) && deployments.length > 0) {
        deployments.slice(0, 5).forEach((d: any, i: number) => {
          console.log(
            `  ${i + 1}. Status: ${d.status}, Created: ${d.createdAt}`,
          );
        });
      } else {
        console.log("  No deployment history available");
      }
    }
  } catch (_e) {
    console.log("\n⚠️  Could not fetch deployment history");
  }
}

checkDeploymentStatus().catch(console.error);
