import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config();

async function main() {
  console.log("Probing TestSprite MCP...");

  const apiKey = process.env.TESTSPRITE_API_KEY;
  if (!apiKey) {
    console.error("TESTSPRITE_API_KEY is missing in .env");
    process.exit(1);
  }

  // Configuration matches .mcp-config.json
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@testsprite/testsprite-mcp@latest"],
    env: {
      ...process.env,
      TESTSPRITE_API_KEY: apiKey,
    },
  });

  const client = new Client(
    {
      name: "testsprite-probe",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    await client.connect(transport);
    console.log("Connected to TestSprite MCP!");

    const tools = await client.listTools();
    console.log("\nAvailable Tools:");
    tools.tools.forEach((t) => {
      console.log(`- ${t.name}: ${t.description}`);
      console.log(`  Schema: ${JSON.stringify(t.inputSchema, null, 2)}`);
    });
  } catch (error) {
    console.error("Error connecting to TestSprite:", error);
  } finally {
    await client.close();
  }
}

main();
