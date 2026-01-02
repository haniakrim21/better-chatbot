import "dotenv/config";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { UserTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

async function main() {
  const email = "haniakrim@gmail.com";
  console.log(`Checking permissions for ${email}...`);

  const user = await pgDb
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email))
    .limit(1);

  if (user.length === 0) {
    console.log("User not found!");

    // List all users to see who is there
    const allUsers = await pgDb.select().from(UserTable);
    console.log(
      "Available users:",
      allUsers.map((u) => `${u.email} (${u.role})`).join(", "),
    );
    return;
  }

  const currentUser = user[0];
  console.log(`Current role: ${currentUser.role}`);

  if (currentUser.role !== "admin") {
    console.log("Upgrading to admin...");
    await pgDb
      .update(UserTable)
      .set({ role: "admin" })
      .where(eq(UserTable.id, currentUser.id));
    console.log("User upgraded to admin.");
  } else {
    console.log("User is already admin.");
  }
}

main()
  .catch(console.error)
  .then(() => process.exit(0));
