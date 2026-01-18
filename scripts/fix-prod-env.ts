// import fetch from "node-fetch";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_2zb0sf2dfyi9"; // NabdAI

// The Connection String we CONFIRMED works and has the synced data
const CORRECT_DB_URL =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/mydb";

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🚀 Fixing Production Environment Variables...");

    // 1. Fetch current config
    const currentServiceRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${APP_SERVICE_ID}`,
      { headers },
    );

    if (!currentServiceRes.ok) {
      throw new Error(
        `Failed to fetch service: ${await currentServiceRes.text()}`,
      );
    }

    const currentService = await currentServiceRes.json();
    const existingEnv = currentService.env || [];

    // 2. Prepare Updates
    const newEnv = [...existingEnv];

    // Find POSTGRES_URL
    const dbIdx = newEnv.findIndex((e: any) => e.key === "POSTGRES_URL");

    if (dbIdx !== -1) {
      console.log(
        `Found existing POSTGRES_URL (Length: ${newEnv[dbIdx].value?.length || 0}). Updating...`,
      );
      newEnv[dbIdx] = {
        key: "POSTGRES_URL",
        value: CORRECT_DB_URL,
        secret: false,
      };
    } else {
      console.log(`POSTGRES_URL not found. Adding...`);
      newEnv.push({
        key: "POSTGRES_URL",
        value: CORRECT_DB_URL,
        secret: false,
      });
    }

    // 3. Push Updates
    console.log("Pushing updates to Sliplane (will trigger restart)...");
    const payload = {
      env: newEnv,
      deployment: currentService.deployment,
    };

    const updateRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${APP_SERVICE_ID}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${await updateRes.text()}`);
    }

    console.log("✅ Environment fixed! Service restarting...");
    console.log(`Linked to DB: ${CORRECT_DB_URL.split("@")[1]}`); // Log masked
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
