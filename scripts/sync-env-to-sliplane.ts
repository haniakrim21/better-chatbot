import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

const ENV_KEYS_TO_SYNC = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "GROQ_BASE_URL",
  "EXA_API_KEY",
];

async function main() {
  console.log("🚀 Syncing AI API Keys to Sliplane...");

  // 1. Read Local .env
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found!");
    process.exit(1);
  }

  const localEnvConfig = dotenv.parse(fs.readFileSync(envPath));
  const newEnvVars = [];

  for (const key of ENV_KEYS_TO_SYNC) {
    if (localEnvConfig[key]) {
      console.log(`Found local key: ${key}`);
      newEnvVars.push({
        key,
        value: localEnvConfig[key],
        secret: key.includes("KEY") || key.includes("SECRET"), // Auto-detect secret
      });
    }
  }

  if (newEnvVars.length === 0) {
    console.log("⚠️ No matching API keys found in .env to sync.");
    return;
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    // 2. Fetch Current Config to preserve existing
    console.log("Fetching current Service config...");
    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Failed to fetch service: ${res.status}`);

    const service = (await res.json()) as any;
    const existingEnv = service.env || [];

    // 3. Merge Env Vars
    // Filter out existing keys that we are about to update
    const filteredExisting = existingEnv.filter(
      (e: any) => !ENV_KEYS_TO_SYNC.includes(e.key),
    );

    const mergedEnv = [...filteredExisting, ...newEnvVars];

    console.log(`\nSyncing ${newEnvVars.length} new/updated keys...`);

    // 4. Update Service
    const updatePayload = {
      deployment: service.deployment, // Required to strictly maintain current deployment
      env: mergedEnv,
    };

    const updateRes = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
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

    console.log("✅ Environment Sync Successful!");
    console.log("Service is redeploying with the new API keys.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
