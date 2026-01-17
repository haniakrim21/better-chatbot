import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_lqex51ny2gbkyiica2m2xwmm";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const SERVICE_ID = "service_3uamp29uw6p4"; // NabdAI

// Keys we want to ensure are synced from local .env to Sliplane
const ENV_KEYS_TO_SYNC = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "GROQ_BASE_URL",
  "EXA_API_KEY",
  "BRAVE_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "SLACK_BOT_TOKEN",
  "SLACK_TEAM_ID",
  "GITHUB_TOKEN",
  "FILE_BASED_MCP_CONFIG",
];

// Keys to preserve even if not in local .env
const ENV_KEYS_TO_PRESERVE = ["POSTGRES_URL", "DATABASE_URL"];

async function main() {
  console.log("🚀 Syncing Environment to Sliplane...");

  // 1. Read Local .env
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found!");
    process.exit(1);
  }

  const localEnvConfig = dotenv.parse(fs.readFileSync(envPath));
  const newEnvVars: any[] = [];

  for (const key of ENV_KEYS_TO_SYNC) {
    if (localEnvConfig[key] !== undefined) {
      console.log(`Found local key: ${key}`);
      newEnvVars.push({
        key,
        value: localEnvConfig[key],
        secret:
          key.includes("KEY") ||
          key.includes("SECRET") ||
          key.includes("TOKEN"),
      });
    }
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    // 2. Fetch Current Config
    console.log("Fetching current Service config...");
    const res = await fetch(
      `${API_BASE}/projects/${PROJECT_ID}/services/${SERVICE_ID}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Failed to fetch service: ${res.status}`);

    const service = (await res.json()) as any;
    const existingEnv = service.env || [];

    // Check for POSTGRES_URL in existing env
    const pgUrl = existingEnv.find((e: any) => e.key === "POSTGRES_URL");
    if (pgUrl) {
      console.log("✅ Found POSTGRES_URL in Sliplane environment.");
      // I'll save this to a temp file so I can use it later to run migrations/seeds
      fs.writeFileSync("sliplane_db_url.txt", pgUrl.value);
    } else {
      console.warn("⚠️ POSTGRES_URL not found in Sliplane environment!");
    }

    // 3. Merge Env Vars
    // Keep existing vars that are either:
    // 1. Not in ENV_KEYS_TO_SYNC (so we don't override them)
    // 2. In ENV_KEYS_TO_PRESERVE (like POSTGRES_URL which is set manually)
    const filteredExisting = existingEnv.filter(
      (e: any) =>
        !ENV_KEYS_TO_SYNC.includes(e.key) ||
        ENV_KEYS_TO_PRESERVE.includes(e.key),
    );

    const mergedEnv = [...filteredExisting, ...newEnvVars];

    console.log(`\nSyncing ${newEnvVars.length} keys...`);

    // 4. Update Service
    const updatePayload = {
      deployment: service.deployment,
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
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
