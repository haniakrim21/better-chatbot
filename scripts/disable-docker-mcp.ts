import "dotenv/config";
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import { McpServerTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Disabling Docker MCP Server...");

  try {
    const result = await db
      .update(McpServerTable)
      .set({ enabled: false })
      .where(eq(McpServerTable.name, "Docker"))
      .returning();

    if (result.length > 0) {
      console.log(
        `Successfully disabled ${result.length} Docker MCP server(s).`,
      );
    } else {
      console.log("No Docker MCP server found to disable.");
    }
  } catch (err) {
    console.error("Failed to disable Docker MCP server:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();
