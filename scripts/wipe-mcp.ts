import "dotenv/config";
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import { McpServerTable } from "../src/lib/db/pg/schema.pg";

async function main() {
  console.log("Wiping all MCP Servers from database...");

  try {
    await db.delete(McpServerTable);
    console.log("Successfully deleted all MCP servers.");
  } catch (error) {
    console.error("Error wiping MCP servers:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
