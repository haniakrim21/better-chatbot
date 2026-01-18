import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, json, uuid } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/mydb";

const pool = new Pool({ connectionString });

async function main() {
  console.log("🔍 Inspecting Agents in Production...");

  const targetNames = [
    "Speechwriter",
    "Grant Writer",
    "Editor in Chief",
    "Stock Analysis Expert",
  ];

  for (const name of targetNames) {
    console.log(`\n--- Checking: "${name}" ---`);
    const res = await pool.query(
      'SELECT id, name, instructions, created_at FROM "agent" WHERE name = $1',
      [name],
    );

    if (res.rows.length === 0) {
      console.log("❌ No agent found with this name.");
    } else {
      console.log(`Found ${res.rows.length} records:`);
      res.rows.forEach((row, i) => {
        console.log(`\n[${i + 1}] ID: ${row.id}`);
        console.log(`    Created: ${row.created_at}`);
        console.log(`    Instructions Type: ${typeof row.instructions}`);
        console.log(
          `    Instructions: ${JSON.stringify(row.instructions, null, 2)}`,
        );
      });
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
