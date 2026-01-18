import { Client } from "pg";

const connectionString =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:5432/mydb";

async function main() {
  console.log("Testing connection to:", connectionString);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("Time:", res.rows[0].now);

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

    await client.end();
  } catch (e: any) {
    console.error("❌ Connection failed:", e.message);
  }
}

main();
