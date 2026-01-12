import "dotenv/config";
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import { McpServerTable } from "../src/lib/db/pg/schema.pg";

async function main() {
  console.log("Listing MCP Servers...");
  const servers = await db.select().from(McpServerTable);

  if (servers.length === 0) {
    console.log("No MCP servers found.");
  } else {
    servers.forEach((s) => {
      console.log(`- Name: ${s.name}, Command: ${JSON.stringify(s.config)}`);
    });
  }
  process.exit(0);
}

main();
