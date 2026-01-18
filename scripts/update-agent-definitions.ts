import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import dotenv from "dotenv";
import { STATIC_AGENTS } from "../src/lib/ai/agent/examples/static-agents";
import { generateUUID } from "../src/lib/utils";

dotenv.config();

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/mydb"; // Default to Prod for now

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Schema Definition (matching valid DB schema)
const AgentTable = pgTable("agent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: json("icon"),
  userId: uuid("user_id").notNull(),
  instructions: json("instructions"),
  visibility: varchar("visibility").notNull().default("public"),
  tags: json("tags"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

async function main() {
  console.log("🚀 Updating All Agent Definitions...");

  // 1. Get System User
  const userResult = await pool.query('SELECT id FROM "user" LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error("No users found. Please seed users first.");
    process.exit(1);
  }
  const systemUserId = userResult.rows[0].id;
  console.log(`👤 Identifying as User ID: ${systemUserId}`);

  for (const agent of STATIC_AGENTS) {
    // 2. Check if Agent exists
    const check = await pool.query('SELECT id FROM "agent" WHERE name = $1', [
      agent.name,
    ]);

    if (check.rows.length > 0) {
      // Update existing
      console.log(`Updating existing agent: ${agent.name}`);
      await pool.query(
        `UPDATE "agent" SET description = $1, instructions = $2, icon = $3, tags = $4, updated_at = NOW() WHERE name = $5`,
        [
          agent.description,
          JSON.stringify(agent.instructions),
          JSON.stringify(agent.icon),
          JSON.stringify(agent.tags),
          agent.name,
        ],
      );
    } else {
      // Insert new
      console.log(`Creating new agent: ${agent.name}`);
      await db.insert(AgentTable as any).values({
        id: generateUUID(), // Generate ID for new agents
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        userId: systemUserId,
        instructions: agent.instructions,
        visibility: "public",
        tags: agent.tags,
        usageCount: 0,
      } as any);
    }
  }

  console.log("✅ All Agents updated/created successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
