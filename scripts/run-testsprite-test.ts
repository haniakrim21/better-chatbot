import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config();

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return val;
}

async function main() {
  console.log("🚀 Starting TestSprite Test Run...");

  const _apiKey = getEnv("TESTSPRITE_API_KEY");
  const projectPath = process.cwd();

  // Connect to MCP Server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@testsprite/testsprite-mcp@latest"],
    env: { ...process.env },
  });

  const client = new Client(
    { name: "testsprite-runner", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to TestSprite MCP");

    // 1. Bootstrap
    console.log("\n📦 Bootstrapping...");
    const bootstrapRes = await client.callTool({
      name: "testsprite_bootstrap",
      arguments: {
        localPort: 3010, // Running on host port 3010
        pathname: "",
        type: "frontend",
        projectPath: projectPath,
        testScope: "codebase",
      },
    });
    console.log("Bootstrap Result:", JSON.stringify(bootstrapRes, null, 2));

    // 2. Generate Test Plan
    console.log("\n📝 Generating Frontend Test Plan...");
    const planRes = await client.callTool({
      name: "testsprite_generate_frontend_test_plan",
      arguments: {
        projectPath: projectPath,
        needLogin: false,
      },
    });
    console.log("Plan Result:", JSON.stringify(planRes, null, 2));

    // 3. Execute Tests
    console.log("\n🧪 Executing Tests...");
    const execRes = await client.callTool({
      name: "testsprite_generate_code_and_execute",
      arguments: {
        projectName: "better-chatbot",
        projectPath: projectPath,
        testIds: [], // All
        additionalInstruction:
          "Check if the homepage title is correct and if the 'Sign In' button exists.",
      },
    });
    console.log("Execution Result:", JSON.stringify(execRes, null, 2));
  } catch (error) {
    console.error("❌ Error running TestSprite:", error);
  } finally {
    await client.close();
  }
}

main();
