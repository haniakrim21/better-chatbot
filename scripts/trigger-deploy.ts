import { createInterface } from "readline";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

async function main() {
  console.log("🚀 Triggering Manual Deployment for NabdAI...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}/deploy`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({}), // Empty body for repo deployment? Spec says required: false
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Deployment failed: ${res.status} ${err}`);
    }

    console.log("✅ Deployment Triggered Successfully!");
    console.log("Monitor status at https://ctrl.sliplane.io");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
