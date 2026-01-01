import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { UserTable } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});
const db = drizzle(pool);

async function diagnose() {
  console.log("Checking for user haniakrim@gmail.com...");
  try {
    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, "haniakrim@gmail.com"));

    if (users.length === 0) {
      console.log("❌ User haniakrim@gmail.com NOT FOUND.");
    } else {
      const u = users[0];
      console.log("✅ User FOUND:");
      console.log(`- ID: ${u.id}`);
      console.log(`- Email: ${u.email}`);
      console.log(`- Name: ${u.name}`);
      console.log(`- Role: ${u.role}`);
      console.log(`- Banned: ${u.banned}`);
      console.log(`- CreatedAt: ${u.createdAt}`);
    }
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  } finally {
    await pool.end();
  }
}

diagnose();
