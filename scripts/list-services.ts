const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

async function listServices() {
  console.log("Listing services...");
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/services`, {
      headers,
    });

    if (!res.ok) {
      console.error(`Status: ${res.status}`);
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  }
}

listServices();
