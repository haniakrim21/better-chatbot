import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { MCPServerConfig } from "../src/types/mcp";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding Smithery MCPs...");

  const targetEmail = "haniakrim@gmail.com";
  const user = await db.query.UserTable.findFirst({
    where: eq(schema.UserTable.email, targetEmail),
  });

  if (!user) {
    console.error(
      `User ${targetEmail} not found. functionality requires a valid user to own the seed data.`,
    );
    process.exit(1);
  }

  const smitheryMcps: {
    name: string;
    description: string;
    config: MCPServerConfig;
    tags: string[];
    iconUrl?: string;
  }[] = [
    {
      name: "Brave Search (Smithery)",
      description: "Web search capabilities using Brave Search via Smithery.",
      config: {
        command: "npx",
        args: [
          "-y",
          "@smithery/cli",
          "run",
          "@smithery/brave-search",
          "--config",
          '{"API_KEY":"YOUR_API_KEY"}',
        ],
      },
      tags: ["search", "smithery", "web"],
    },
    {
      name: "GitHub (Smithery)",
      description: "Integration with GitHub API for repository management.",
      config: {
        command: "npx",
        args: [
          "-y",
          "@smithery/cli",
          "run",
          "@smithery/github",
          "--config",
          '{"token":"YOUR_GITHUB_TOKEN"}',
        ],
      },
      tags: ["developer", "smithery", "github"],
    },
    {
      name: "Spotify (Smithery)",
      description: "Control Spotify playback and search for tracks.",
      config: {
        command: "npx",
        args: ["-y", "@smithery/cli", "run", "@smithery/spotify"],
      },
      tags: ["music", "smithery", "media"],
    },
  ];

  for (const mcp of smitheryMcps) {
    console.log(`Inserting ${mcp.name}...`);
    // Check if exists
    const existing = await db.query.McpServerTable.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.name, mcp.name), eq(table.userId, user.id)),
    });

    if (existing) {
      console.log(`Skipping ${mcp.name}, already exists.`);
      continue;
    }

    await db.insert(schema.McpServerTable).values({
      name: mcp.name,
      description: mcp.description,
      config: mcp.config,
      userId: user.id,
      visibility: "public",
      tags: mcp.tags,
      enabled: true,
    });
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
