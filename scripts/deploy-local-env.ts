import fs from "fs";
import path from "path";

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_2zb0sf2dfyi9"; // NabdAI

const KEYS_TO_SYNC = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NEXT_PUBLIC_WEBCONTAINER_CLIENT_ID",
  "ENCRYPTION_KEY",
];

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🚀 Syncing Local Keys to Production...");

    // 1. Read local .env
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      throw new Error(".env file not found");
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const localEnv: Record<string, string> = {};

    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        localEnv[key] = value;
      }
    });

    // 2. Filter keys to sync
    const updates: { key: string; value: string; secret: boolean }[] = [];
    KEYS_TO_SYNC.forEach((key) => {
      if (localEnv[key]) {
        updates.push({
          key,
          value: localEnv[key],
          secret: key.includes("KEY") || key.includes("SECRET"), // Simple heuristic
        });
      }
    });

    if (updates.length === 0) {
      console.log("No matching keys found in .env to sync.");
      return;
    }

    console.log(
      `Found ${updates.length} keys to sync: ${updates.map((u) => u.key).join(", ")}`,
    );

    // 3. Fetch current service config
    console.log("Fetching current service config...");
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

    // 4. Merge updates
    const newEnv = [...existingEnv];
    updates.forEach((up) => {
      const idx = newEnv.findIndex((e: any) => e.key === up.key);
      if (idx !== -1) {
        console.log(`Updating ${up.key}`);
        newEnv[idx] = up;
      } else {
        console.log(`Adding ${up.key}`);
        newEnv.push(up);
      }
    });

    // 5. Update Service
    console.log("Pushing updates to Sliplane...");
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

    console.log("✅ Environment variables updated successfully!");
    console.log("Service should restart automatically.");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
