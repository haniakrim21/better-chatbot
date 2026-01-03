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

dotenv.config();

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://your_username:your_password@localhost:5432/your_database_name";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Simplified Agent Table Schema for seeding
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

interface LobeAgent {
  identifier: string;
  author: string;
  createAt: string;
  meta: {
    avatar: string;
    description: string;
    tags: string[];
    title: string;
    systemRole: string;
  };
}

async function main() {
  console.log("Fetching Agents from LobeHub...");

  const response = await fetch("https://chat-agents.lobehub.com/index.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  const result = await response.json();
  // LobeHub JSON structure might be { agents: [...] } or just [...]
  const agents: LobeAgent[] = Array.isArray(result)
    ? result
    : (result as any).agents;

  console.log(`Found ${agents.length} agents.`);

  // We need a system user ID to assign these agents to.
  // Ideally, use a dedicated "System" or "Community" user, or the first admin user found.
  // For now, let's query the first user in the DB.

  const userResult = await pool.query('SELECT id FROM "user" LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error(
      "No users found in database to assign agents to. Please create a user first.",
    );
    process.exit(1);
  }
  const systemUserId = userResult.rows[0].id;
  console.log(`Assigning agents to User ID: ${systemUserId}`);

  let count = 0;
  for (const agent of agents) {
    if (!agent.meta.systemRole) continue; // Skip agents without instructions

    const description = agent.meta.description || agent.meta.title;
    const tags = agent.meta.tags || [];

    // Determine icon type
    let icon = { type: "emoji", value: "🤖" };
    if (agent.meta.avatar && agent.meta.avatar.startsWith("http")) {
      // It's an image, but our schema fully supports emojis simpler.
      // If it's an emoji string (Lobe often uses them), use it.
      // If it's a URL, we might fallback or try to use it if schema supports 'image' type.
      // Checked schema: Icon is JSON, usually type: "emoji" | "image".
      icon = { type: "image", value: agent.meta.avatar };
    } else if (agent.meta.avatar) {
      icon = { type: "emoji", value: agent.meta.avatar };
    }

    try {
      // Drizzle "where" generic object syntax is tricky without exact table schema import.
      // Falling back to raw SQL check or just insert.
      // Let's simpler: Just Insert. On conflict maybe skip?
      // Since we don't have a unique constraint on name, we might duplicate.
      // Let's do a quick check via sql execution if needed or relying on unique name isn't safe.
      // Correct approach: Select first using raw query.
      const check = await pool.query('SELECT id FROM "agent" WHERE name = $1', [
        agent.meta.title,
      ]);

      if (check.rows.length > 0) {
        console.log(`Skipping existing agent: ${agent.meta.title}`);
        continue;
      }

      await db.insert(AgentTable as any).values({
        name: agent.meta.title,
        description: description.substring(0, 8000), // Enforce limit
        icon: icon,
        userId: systemUserId,
        instructions: { systemPrompt: agent.meta.systemRole },
        visibility: "public",
        tags: tags,
        usageCount: Math.floor(Math.random() * 1000), // Fake popularity for now or 0
      } as any);

      count++;
      process.stdout.write(".");
    } catch (err) {
      console.error(`Failed to insert ${agent.meta.title}:`, err);
    }
  }

  console.log(`\nSuccessfully added ${count} LobeHub agents.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
