import { config } from "dotenv";
config();

import { auth } from "auth/auth-instance";
import { USER_ROLES } from "app-types/roles";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { UserTable } from "lib/db/pg/schema.pg";
import { eq, sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});
const db = drizzle(pool);

async function createSpecificUser() {
  const email = "haniakrim@gmail.com";
  const password = "Password123!";
  const name = "Hani Akrim";

  console.log(`Creating user ${email}...`);

  try {
    // 1. Check if user exists
    const [existingUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    if (existingUser) {
      console.log(
        "User already exists. Updating password not supported directly via this simple script without auth API implementation details, better to delete and recreate or use auth api to reset if possible.",
      );
      // For simplicity in this dev/test context, let's delete and recreate to ensure password is known
      console.log("Deleting existing user to reset password...");
      await db.delete(UserTable).where(eq(UserTable.email, email));
    }

    // 2. Create user using Better Auth
    console.log("Creating user via Better Auth API...");
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: new Headers({
        "content-type": "application/json",
      }),
    });

    if (!result.user) {
      throw new Error("Failed to create user");
    }

    const userId = result.user.id;
    console.log(`User created with ID: ${userId}`);

    // 3. Promote to Admin
    console.log("Promoting to Admin...");
    await db
      .update(UserTable)
      .set({ role: USER_ROLES.ADMIN })
      .where(sql`id = ${userId}`);

    console.log("✅ User created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await pool.end();
  }
}

createSpecificUser();
