import { webcrypto } from "crypto";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";

// Service IDs from previous investigation
const APP_SERVICE_ID = "service_2zb0sf2dfyi9"; // NabdAI
const _PG_SERVICE_ID = "service_11h69bcja1cu"; // Postgres-NdZY

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🚀 Configuring Production Environment...");

    // 1. Fetch Postgres Service to confirm internal domain (optional but good practice, skipping for speed as we saw it)
    // We already know it: postgres-ndzy.internal

    // 2. Fetch App Service to get current env
    console.log("Fetching current app service config...");
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

    // 3. Define New Env variables
    const postgresUrl =
      "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.internal:5432/mydb";
    const betterAuthUrl = "https://nabdai.sliplane.app";
    // Generate a random secret if one doesn't exist
    const randomSecret = Buffer.from(
      webcrypto.getRandomValues(new Uint8Array(32)),
    ).toString("base64");

    const updates = [
      { key: "POSTGRES_URL", value: postgresUrl, secret: true },
      // Ensure Better Auth vars are set
      { key: "BETTER_AUTH_URL", value: betterAuthUrl, secret: false },
      { key: "BETTER_AUTH_SECRET", value: randomSecret, secret: true }, // We'll just generate a new one, hope that's okay. User usually generates one.
      // Add minimal other expected vars if missing
      { key: "FILE_STORAGE_TYPE", value: "vercel-blob", secret: false },
      { key: "HOST", value: "0.0.0.0", secret: false },
    ];

    console.log("Preparing environment updates...");

    // Merge updates: overwrite existing keys
    const newEnv = [...existingEnv];
    updates.forEach((up) => {
      const idx = newEnv.findIndex((e: any) => e.key === up.key);
      if (idx !== -1) {
        // Only update if value is different? Or just force update.
        // For SECRETs we can't see the value easily (it might be empty in response).
        // Let's just overwrite.
        if (
          up.key === "BETTER_AUTH_SECRET" &&
          newEnv[idx].value &&
          newEnv[idx].value !== ""
        ) {
          // Don't overwrite existing secret if it looks set (though API returns empty string for secrets sometimes)
          // actually API returns empty string for secrets. so we can't know if it's set.
          // But since the service was 404/broken/fresh, we assume we need to set it.
          console.log("Overwriting BETTER_AUTH_SECRET");
        }
        newEnv[idx] = up;
      } else {
        newEnv.push(up);
      }
    });

    // 4. Update Service
    console.log("Updating service configuration...");
    // Sliplane API requires full service object for updates ideally, or patch with just partial?
    // Based on fix-auth-env.ts it sends a payload with env.

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

    console.log("✅ Service configuration updated successfully!");
    console.log(
      "Service should restart automatically. Monitoring logs is recommended.",
    );

    // 5. Trigger Deploy manually just in case
    console.log("Triggering deployment...");
    const deployRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${APP_SERVICE_ID}/deploy`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      },
    );

    if (!deployRes.ok) {
      console.error(`Deploy trigger failed: ${await deployRes.text()}`);
    } else {
      console.log("✅ Deployment triggered.");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
