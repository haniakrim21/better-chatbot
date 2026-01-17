const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";

async function main() {
  console.log("🚀 Listing all Sliplane Projects...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${API_BASE}/projects`, { headers });
    if (!res.ok) throw new Error(`Failed to list projects: ${res.status}`);
    const projects = (await res.json()) as any[];

    console.log("Projects found:");
    projects.forEach((p) => {
      console.log(`- ${p.name} (${p.id})`);
    });
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
