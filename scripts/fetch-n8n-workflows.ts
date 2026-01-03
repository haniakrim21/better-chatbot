import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Simplified Workflow Tables
const WorkflowTable = pgTable("workflow", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: json("icon"),
  userId: uuid("user_id").notNull(),
  visibility: varchar("visibility").notNull().default("private"),
  isPublished: boolean("is_published").default(false),
  tags: json("tags"),
  version: varchar("version").notNull().default("1.0.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const WorkflowNodeTable = pgTable("workflow_node", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => WorkflowTable.id, { onDelete: "cascade" }),
  kind: varchar("kind").notNull(),
  name: varchar("name").notNull(),
  nodeConfig: json("node_config").notNull().default({}),
  uiConfig: json("ui_config").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const WorkflowEdgeTable = pgTable("workflow_edge", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => WorkflowTable.id, { onDelete: "cascade" }),
  source: uuid("source").notNull(),
  target: uuid("target").notNull(),
  uiConfig: json("ui_config").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

async function fetchGitHubRepoContents(path = "") {
  const repo = "enescingoz/awesome-n8n-templates";
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Better-Chatbot-Seed-Script",
    },
  });
  if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
  return await response.json();
}

async function main() {
  console.log("Fetching n8n Workflows...");

  // Get system user
  const userResult = await pool.query('SELECT id FROM "user" LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const systemUserId = userResult.rows[0].id;

  // 1. Traverse Categories
  const rootContents = await fetchGitHubRepoContents();
  const categories = rootContents.filter(
    (item: any) => item.type === "dir" && !item.name.startsWith("."),
  );

  let count = 0;

  for (const category of categories) {
    console.log(`Processing category: ${category.name}`);
    try {
      const catContents = await fetchGitHubRepoContents(category.path);
      const jsonFiles = catContents.filter((item: any) =>
        item.name.endsWith(".json"),
      );

      for (const fileItem of jsonFiles) {
        try {
          const rawRes = await fetch(fileItem.download_url);
          const n8nJson = await rawRes.json();

          // n8n JSON structure check
          if (!n8nJson.nodes || !n8nJson.connections) {
            continue;
          }

          const name = fileItem.name.replace(".json", "").replace(/_/g, " ");

          // Insert Workflow
          const workflowRes = await db
            .insert(WorkflowTable as any)
            .values({
              name: name,
              description: `Imported from ${category.name}`,
              userId: systemUserId,
              visibility: "public",
              isPublished: true,
              tags: ["n8n", category.name],
              icon: { type: "lucide", value: "workflow" },
            } as any)
            .returning();
          const workflow = workflowRes[0];

          // Map Nodes
          const nodeMap = new Map<string, string>(); // n8n name -> db uuid

          for (const n8nNode of n8nJson.nodes) {
            const nodeRes = await db
              .insert(WorkflowNodeTable as any)
              .values({
                workflowId: workflow.id,
                kind: "n8n-node", // Generic kind for now
                name: n8nNode.name,
                nodeConfig: n8nNode.parameters || {}, // Store parameters
                uiConfig: {
                  position: n8nNode.position,
                  n8nType: n8nNode.type,
                },
              } as any)
              .returning();
            const node = nodeRes[0];
            nodeMap.set(n8nNode.name, node.id);
          }

          // Map Edges
          // n8n connections: { "Node A": { "main": [ [ { "node": "Node B", "type": "main", "index": 0 } ] ] } }
          for (const [sourceName, outputs] of Object.entries(
            n8nJson.connections,
          )) {
            const sourceId = nodeMap.get(sourceName);
            if (!sourceId) continue;

            const outputTypes = outputs as any;
            for (const outputTypeKey in outputTypes) {
              // e.g. "main"
              const connections = outputTypes[outputTypeKey];
              for (const connectionGroup of connections) {
                for (const conn of connectionGroup) {
                  const targetId = nodeMap.get(conn.node);
                  if (targetId) {
                    await db.insert(WorkflowEdgeTable as any).values({
                      workflowId: workflow.id,
                      source: sourceId,
                      target: targetId,
                      uiConfig: { sourceHandle: outputTypeKey },
                    } as any);
                  }
                }
              }
            }
          }

          count++;
          process.stdout.write(".");
        } catch (_err) {
          // Ignore parse errors
        }
      }
    } catch (err) {
      console.error(`Error processing category ${category.name}:`, err);
    }
  }

  console.log(`\nSuccessfully added ${count} n8n workflows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
