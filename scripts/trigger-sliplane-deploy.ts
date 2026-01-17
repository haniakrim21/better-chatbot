import * as dotenv from "dotenv";

dotenv.config();

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function triggerDeployment() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "X-Organization-ID": ORG_ID,
  };

  console.log("🚀 Triggering deployment for NabdAI service...");

  // Get current service to trigger redeployment
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

  // Trigger deployment by updating the service with the same config
  const updateRes = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        deployment: service.deployment,
      }),
    },
  );

  if (!updateRes.ok) {
    throw new Error(
      `Failed to trigger deployment: ${updateRes.status} ${await updateRes.text()}`,
    );
  }

  console.log("✅ Deployment triggered successfully!");
  console.log(
    "Visit https://sliplane.io/dashboard to monitor deployment progress.",
  );
}

triggerDeployment().catch(console.error);
