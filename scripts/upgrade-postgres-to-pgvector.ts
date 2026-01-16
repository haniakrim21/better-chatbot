import { createInterface } from "readline";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const POSTGRES_SERVICE_ID = "service_z1a762s8lvta"; // Postgres-Ms05

// Use pgvector image compatible with Postgres 16
const NEW_IMAGE = "pgvector/pgvector:pg16";

async function main() {
  console.log("🚀 Upgrading Postgres Service to support pgvector...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    // 1. Fetch Current Config
    console.log("Fetching current Postgres config...");
    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${POSTGRES_SERVICE_ID}`,
      { headers },
    );

    if (!res.ok) {
      throw new Error(
        `Failed to fetch service: ${res.status} ${await res.text()}`,
      );
    }

    const service = (await res.json()) as any;
    console.log(`Current Image: ${service.deployment.url}`);

    if (service.deployment.url === NEW_IMAGE) {
      console.log("✅ Already running pgvector image. No changes needed.");
      return;
    }

    // 2. Patch Service with New Image
    console.log(`Updating image to: ${NEW_IMAGE}`);

    const updatePayload = {
      deployment: {
        ...service.deployment,
        url: NEW_IMAGE,
      },
    };

    const updateRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${POSTGRES_SERVICE_ID}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updatePayload),
      },
    );

    if (!updateRes.ok) {
      throw new Error(
        `Failed to update service: ${updateRes.status} ${await updateRes.text()}`,
      );
    }

    const updatedService = (await updateRes.json()) as any;
    console.log("✅ Update Successful!");
    console.log(
      `Service '${updatedService.name}' is now redeploying with pgvector support.`,
    );
    console.log("Note: It may take a minute for the restart to complete.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
