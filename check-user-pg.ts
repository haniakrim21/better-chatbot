import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    // Assuming table name is "user" based on Better Auth defaults, but Drizzle might prefix or quote it.
    // Let's list tables first if we are unsure, but usually "user" or "users".
    // Better Auth schema usually uses "user".

    const email = "haniakrim@gmail.com";
    const res = await client.query('SELECT * FROM "user" WHERE email = $1', [
      email,
    ]);

    if (res.rows.length > 0) {
      console.log("User FOUND:", res.rows[0]);
    } else {
      console.log("User NOT found for email:", email);
    }
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await client.end();
  }
}

main();
