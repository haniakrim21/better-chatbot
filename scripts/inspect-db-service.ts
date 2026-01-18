// import fetch from "node-fetch";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const DB_SERVICE_ID = "service_11h69bcja1cu"; // Postgres-NdZY

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🔍 Fetching DB Service Config...");

    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${DB_SERVICE_ID}`,
      { headers },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch service: ${await res.text()}`);
    }

    const service = await res.json();
    console.log("✅ Config Fetched!");

    console.log("\n--- ENV VARS ---");
    (service.env || []).forEach((e: any) => {
      console.log(`${e.key}: ${e.value}`);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
