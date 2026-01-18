// import fetch from "node-fetch"; // Using global fetch

const API_BASE = "https://ctrl.sliplane.io/v0";
const TOKEN = "api_rw_1gwwmrnkjkc6xlw2agq8r9hf";
const ORG_ID = "org_eo03kcny1dp0";
const PROJECT_ID = "project_ju5iup0kyxfp";
const APP_SERVICE_ID = "service_2zb0sf2dfyi9"; // NabdAI

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Organization-ID": ORG_ID,
    "Content-Type": "application/json",
  };

  try {
    console.log("🔍 Fetching Production Service Config...");

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

    console.log("✅ Config Fetched!");

    console.log("\n--- ALL ENV VARS ---");
    existingEnv.forEach((e: any) => {
      const val = e.value || "";
      const masked =
        val.length > 10
          ? val.substring(0, 4) + "..." + val.substring(val.length - 4)
          : val;
      console.log(`${e.key}: ${masked}`);
    });

    const pgUrl = existingEnv.find((e: any) => e.key === "POSTGRES_URL");
    const betterAuthUrl = existingEnv.find(
      (e: any) => e.key === "BETTER_AUTH_URL",
    );

    console.log("\n--- CRITICAL ENV VARS ---");
    console.log(`POSTGRES_URL: ${pgUrl ? pgUrl.value : "NOT SET"}`);
    console.log(
      `BETTER_AUTH_URL: ${betterAuthUrl ? betterAuthUrl.value : "NOT SET"}`,
    );
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
