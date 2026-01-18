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
  (process.env.POSTGRES_USER &&
  process.env.POSTGRES_PASSWORD &&
  process.env.HOST
    ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.HOST}:5432/${process.env.POSTGRES_DB || "mydb"}`
    : "postgresql://postgres:postgres@localhost:5432/postgres");
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
    // console.log(`Processing ${agent.identifier}...`);

    let systemRole = agent.meta.systemRole;
    let iconValue = agent.meta.avatar;

    // If systemRole is missing (which is true for index.json), fetch detail
    if (!systemRole) {
      try {
        const detailUrl = `https://chat-agents.lobehub.com/${agent.identifier}.json`;
        const detailRes = await fetch(detailUrl);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          systemRole = detailData.config?.systemRole || detailData.systemRole;
          if (!iconValue && detailData.meta?.avatar) {
            iconValue = detailData.meta.avatar;
          }
        } else {
          console.warn(
            `Failed to fetch detail for ${agent.identifier}: ${detailRes.status}`,
          );
        }
      } catch (e) {
        console.error(`Error fetching detail for ${agent.identifier}:`, e);
      }
    }

    if (!systemRole) {
      // console.log(`Skipping ${agent.identifier}: No systemRole found after detail fetch`);
      continue;
    }

    const description = agent.meta.description || agent.meta.title;
    const tags = agent.meta.tags || [];

    // Determine icon type
    let icon = { type: "emoji", value: "🤖" };
    if (iconValue && iconValue.startsWith("http")) {
      icon = { type: "image", value: iconValue };
    } else if (iconValue) {
      icon = { type: "emoji", value: iconValue };
    }

    try {
      const check = await pool.query('SELECT id FROM "agent" WHERE name = $1', [
        agent.meta.title,
      ]);

      if (check.rows.length > 0) {
        // console.log(`Skipping existing agent: ${agent.meta.title}`);
        continue;
      }

      await db.insert(AgentTable as any).values({
        name: agent.meta.title,
        description: description.substring(0, 8000), // Enforce limit
        icon: icon,
        userId: systemUserId,
        instructions: { systemPrompt: systemRole },
        visibility: "public",
        tags: tags,
        usageCount: Math.floor(Math.random() * 1000), // Fake popularity for now or 0
      } as any);

      count++;
      if (count % 10 === 0) process.stdout.write(` ${count} `);
      else process.stdout.write(".");
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
