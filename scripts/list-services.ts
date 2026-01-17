const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

async function main() {
  console.log("🚀 Listing all Sliplane Services...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/services`, {
      headers,
    });
    if (!res.ok) throw new Error(`Failed to list services: ${res.status}`);
    const services = (await res.json()) as any[];

    console.log("Services found:");
    services.forEach((s) => {
      console.log(`- ${s.name} (${s.id}) [${s.status}]`);
    });
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
