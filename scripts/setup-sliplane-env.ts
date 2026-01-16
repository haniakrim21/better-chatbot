import { createInterface } from "readline";
import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const _execPromise = promisify(exec);

const API_BASE = "https://ctrl.sliplane.io/v0";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n🚀 Sliplane Environment Setup Wizard\n");

  // 1. Get Credentials
  const apiKey = await question("Enter your Sliplane API Token (Bearer): ");
  if (!apiKey) {
    console.error("API Token is required.");
    process.exit(1);
  }

  // Get Organization ID
  // We can try to guess or just ask. The API requires it.
  const orgId = await question(
    "Enter your Organization ID (X-Organization-ID): ",
  );
  if (!orgId) {
    console.error("Organization ID is required.");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    "X-Organization-ID": orgId.trim(),
    "Content-Type": "application/json",
  };

  try {
    // 2. List Projects
    console.log("\nFetching Projects...");
    const projectsRes = await fetch(`${API_BASE}/projects`, { headers });
    if (!projectsRes.ok)
      throw new Error(`Failed to list projects: ${projectsRes.statusText}`);
    const projects = (await projectsRes.json()) as any[];

    if (projects.length === 0) {
      console.log("No projects found.");
      process.exit(1);
    }

    console.log("\nProjects:");
    projects.forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p.id})`));

    const projectIndexStr = await question("\nSelect Project (number): ");
    const projectIndex = parseInt(projectIndexStr) - 1;
    const project = projects[projectIndex];

    if (!project) throw new Error("Invalid project selection");

    // 3. List Services
    console.log(`\nFetching Services for ${project.name}...`);
    const servicesRes = await fetch(
      `${API_BASE}/projects/${project.id}/services`,
      { headers },
    );
    if (!servicesRes.ok)
      throw new Error(`Failed to list services: ${servicesRes.statusText}`);
    const services = (await servicesRes.json()) as any[];

    if (services.length === 0) {
      console.log("No services found.");
      process.exit(1);
    }

    console.log("\nServices:");
    services.forEach((s, i) => console.log(`${i + 1}. ${s.name} (${s.id})`));

    const serviceIndexStr = await question("\nSelect Service (number): ");
    const serviceIndex = parseInt(serviceIndexStr) - 1;
    const service = services[serviceIndex];

    if (!service) throw new Error("Invalid service selection");

    // 4. Collect Env Vars
    console.log("\n📝 Configuration");
    console.log("We need to set a few critical variables.");

    const postgresUrl = await question("Enter your POSTGRES_URL: ");
    if (!postgresUrl) throw new Error("POSTGRES_URL is required");

    // Generate Secret
    const betterAuthSecret = crypto.randomBytes(32).toString("base64");
    console.log(`\nGenerated BETTER_AUTH_SECRET: ${betterAuthSecret}`);

    // Construct Better Auth URL
    const _defaultUrl = `https://${service.domain}`; // Assuming domain might be available or we construct it
    const betterAuthUrl =
      (await question(
        `Enter BETTER_AUTH_URL (default: https://${service.name}.sliplane.app): `,
      )) || `https://${service.name}.sliplane.app`;

    // File Storage (Optional)
    const fileStorageType =
      (await question("Enter FILE_STORAGE_TYPE (default: vercel-blob): ")) ||
      "vercel-blob";

    // 5. Build Env Payload
    // Fetch existing if needed? Spec says "Providing this key will replace all existing".
    // So we should try to fetch existing first to be safe, OR just overwrite if that's the intention.
    // The user previously had NO env vars working, so overwriting is likely fine, OR we fetch details first.

    // Let's fetch current to be safe and merge
    console.log("Fetching current environment variables...");
    const currentServiceRes = await fetch(
      `${API_BASE}/projects/${project.id}/services/${service.id}`,
      { headers },
    );
    const currentService = (await currentServiceRes.json()) as any;
    const existingEnv = currentService.env || [];

    const newEnv = [
      { key: "POSTGRES_URL", value: postgresUrl, secret: true },
      { key: "BETTER_AUTH_SECRET", value: betterAuthSecret, secret: true },
      { key: "BETTER_AUTH_URL", value: betterAuthUrl, secret: false },
      { key: "FILE_STORAGE_TYPE", value: fileStorageType, secret: false },
      // Add DOCKER_BUILD=0 to ensure we don't treat runtime as docker build env?
      // Actually DOCKER_BUILD=1 was only for build time. Runtime doesn't need it.
    ];

    // Merge: Filter out any existing keys that match new keys, then concat
    const mergedEnv = [
      ...existingEnv.filter((e: any) => !newEnv.find((n) => n.key === e.key)),
      ...newEnv,
    ];

    // 6. Update Service
    console.log("\nUpdating Service Environment...");
    const updateRes = await fetch(
      `${API_BASE}/projects/${project.id}/services/${service.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          env: mergedEnv,
        }),
      },
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Update failed: ${err}`);
    }

    console.log("\n✅ Success! Environment variables updated.");
    console.log("Your service should restart automatically.");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

main();
