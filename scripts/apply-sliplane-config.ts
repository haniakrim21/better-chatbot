import crypto from "crypto";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";

const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

const POSTGRES_URL =
  "postgres://postgres:rNvvZA8GQZNywcux@postgres-ms05.sliplane.app:10664/mydb";
const BETTER_AUTH_SECRET = crypto.randomBytes(32).toString("base64");
const BETTER_AUTH_URL = "https://nabdai.sliplane.app";

async function main() {
  console.log("🚀 Applying Configuration to NabdAI...");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  const env = [
    { key: "POSTGRES_URL", value: POSTGRES_URL, secret: true },
    { key: "BETTER_AUTH_SECRET", value: BETTER_AUTH_SECRET, secret: true },
    { key: "BETTER_AUTH_URL", value: BETTER_AUTH_URL, secret: false },
    { key: "FILE_STORAGE_TYPE", value: "vercel-blob", secret: false },
    // Retain existing if any? The service response showed HOST: 0.0.0.0 only.
    // We can overwrite safer here as the current state is broken/failed.
    { key: "HOST", value: "0.0.0.0", secret: false },
  ];

  // Fetch current service details first to get the deployment object
  console.log("Fetching current service details...");
  const currentServiceRes = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    { headers },
  );
  if (!currentServiceRes.ok)
    throw new Error(`Failed to fetch service: ${currentServiceRes.statusText}`);
  const currentService = (await currentServiceRes.json()) as any;

  console.log("Configuration Payload:", JSON.stringify(env, null, 2));

  const res = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        env,
        deployment: currentService.deployment, // Required by API
      }),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Failed to update:", res.status, errorText);
    process.exit(1);
  }

  const _data = await res.json();
  console.log("✅ Update Successful!");
  console.log("Service should be redeploying now.");
}

main();
