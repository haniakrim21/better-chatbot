import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Searching for 'Test Admin User'...");

  // 1. Find the user
  const user = await db.query.UserTable.findFirst({
    where: eq(schema.UserTable.name, "Test Admin User"),
  });

  if (!user) {
    console.log("User 'Test Admin User' not found.");
    process.exit(0);
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // 2. Count existing MCPs
  const mcps = await db.query.McpServerTable.findMany({
    where: eq(schema.McpServerTable.userId, user.id),
  });

  console.log(`Found ${mcps.length} MCPs owned by this user.`);

  if (mcps.length === 0) {
    console.log("No MCPs to delete.");
    process.exit(0);
  }

  // 3. Delete them
  console.log("Deleting MCPs...");
  const result = await db
    .delete(schema.McpServerTable)
    .where(eq(schema.McpServerTable.userId, user.id))
    .returning();

  console.log(`Successfully deleted ${result.length} MCPs.`);
  result.forEach((r) => console.log(`- Deleted: ${r.name} (${r.id})`));

  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
