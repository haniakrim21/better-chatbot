// import fetch from "node-fetch";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🔍 Fetching All Services...");

    const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/services`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch services: ${await res.text()}`);
    }

    const services = await res.json();
    console.log(`Found ${services.length} services:\n`);

    services.forEach((s: any) => {
      console.log(`Name: ${s.name}`);
      console.log(`ID: ${s.id}`);
      console.log(`URL: ${s.domain || "No URL"}`);
      console.log(`Status: ${s.status}`);
      console.log(`-------------------`);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
