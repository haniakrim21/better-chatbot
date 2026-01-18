import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/mydb";

const pool = new Pool({ connectionString });

async function main() {
  console.log("🔍 Inspecting Agents by ID...");

  const targetIds = [
    "8e5e6833-a011-4d3b-ad70-95469157a314", // Speechwriter from screenshot
    "0babfcd0-7752-49da-adf2-9e68531bffa5", // Grant Writer from screenshot
  ];

  for (const id of targetIds) {
    console.log(`\n--- Checking ID: "${id}" ---`);
    const res = await pool.query('SELECT * FROM "agent" WHERE id = $1', [id]);

    if (res.rows.length === 0) {
      console.log("❌ No agent found with this ID.");
    } else {
      console.log(`✅ Found record:`);
      const row = res.rows[0];
      console.log(`    Name: "${row.name}"`);
      console.log(`    Description: "${row.description}"`);
      console.log(
        `    Instructions: ${JSON.stringify(row.instructions, null, 2)}`,
      );
      console.log(`    User ID: ${row.user_id}`);
      console.log(`    Created At: ${row.created_at}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
