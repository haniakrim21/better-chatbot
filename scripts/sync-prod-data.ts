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
import { STATIC_WORKFLOWS } from "../src/lib/ai/workflow/examples/static-workflows";
import { generateUUID } from "../src/lib/utils";

// Initialize environment
dotenv.config();

// Production DB URL (Hardcoded or from Env)
// Production DB URL (Hardcoded to ensure we hit prod, ignoring local .env placeholders)
const connectionString =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/mydb";

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// --- SCHEMA DEFINITIONS ---
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

const WorkflowTable = pgTable("workflow", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: json("icon"),
  userId: uuid("user_id").notNull(),
  teamId: uuid("team_id"),
  visibility: varchar("visibility").notNull().default("private"),
  isPublished: varchar("is_published").default("false"), // Check actual schema type, usually boolean but string in some backups
  tags: json("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Helper Layout Tables
const WorkflowNodeDataTable = pgTable("workflow_node", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  kind: varchar("kind").notNull(),
  name: varchar("name").notNull(),
  nodeConfig: json("node_config"),
  uiConfig: json("ui_config"),
});

const WorkflowEdgeTable = pgTable("workflow_edge", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  source: varchar("source").notNull(),
  target: varchar("target").notNull(),
});

async function main() {
  console.log("🚀 Starting Production Data Sync...");
  console.log(`   Target: ${connectionString.split("@")[1]}`); // Mask credentials

  // 1. Get System User
  const userResult = await pool.query('SELECT id FROM "user" LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error("❌ No users found. Please seed users first.");
    process.exit(1);
  }
  const systemUserId = userResult.rows[0].id; // 54348ac9-8284-4c22-90e9-67417c2981ff
  console.log(`👤 Using System User ID: ${systemUserId}`);

  // --- SYNC AGENTS ---
  console.log(`\n🤖 Syncing ${STATIC_AGENTS.length} Agents...`);
  for (const agent of STATIC_AGENTS) {
    const check = await pool.query('SELECT id FROM "agent" WHERE name = $1', [
      agent.name,
    ]);

    // Transform instructions from Array (static) to Object (UI schema)
    let instructions = agent.instructions;
    if (Array.isArray(agent.instructions)) {
      const content = agent.instructions[0]?.content || "";
      instructions = {
        role: agent.description, // Use description as default role
        systemPrompt: content,
        mentions: [],
      };
    }

    if (check.rows.length > 0) {
      process.stdout.write(`U`); // Update
      await pool.query(
        `UPDATE "agent" SET description = $1, instructions = $2, icon = $3, tags = $4, updated_at = NOW() WHERE name = $5`,
        [
          agent.description,
          JSON.stringify(instructions), // Use transformed instructions
          JSON.stringify(agent.icon),
          JSON.stringify(agent.tags),
          agent.name,
        ],
      );
    } else {
      process.stdout.write(`C`); // Create
      await db.insert(AgentTable as any).values({
        id: generateUUID(),
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        userId: systemUserId,
        instructions: instructions, // Use transformed instructions
        visibility: "public",
        tags: agent.tags,
        usageCount: 0,
      } as any);
    }
  }
  console.log(" Done.");

  // --- SYNC WORKFLOWS ---
  console.log(`\n⛓️ Syncing ${STATIC_WORKFLOWS.length} Workflows...`);
  for (const wf of STATIC_WORKFLOWS) {
    // Check if Workflow exists by Name
    const check = await pool.query(
      'SELECT id FROM "workflow" WHERE name = $1',
      [wf.name],
    );

    if (check.rows.length > 0) {
      // UPDATE existing Workflow
      // For workflows, updating nodes/edges is complex (replace all?).
      // For now, let's update metadata and maybe recreate nodes if critical.
      // Actually, replacing all nodes/edges is safer to ensure structure matches code.
      const wfId = check.rows[0].id;
      process.stdout.write(`U`);

      // Update Metadata
      await pool.query(
        `UPDATE "workflow" SET description = $1, icon = $2, tags = $3, updated_at = NOW() WHERE id = $4`,
        [
          wf.description,
          JSON.stringify({
            type: "emoji",
            value: wf.icon,
            style: { backgroundColor: "#ffffff" },
          }),
          JSON.stringify(["example"]), // hardcoded tags from seed script
          wfId,
        ],
      );

      // Delete existing Nodes/Edges to replace them
      await pool.query('DELETE FROM "workflow_node" WHERE workflow_id = $1', [
        wfId,
      ]);
      await pool.query('DELETE FROM "workflow_edge" WHERE workflow_id = $1', [
        wfId,
      ]);

      // Re-insert Nodes
      for (const node of wf.nodes) {
        await db.insert(WorkflowNodeDataTable as any).values({
          id: node.id || generateUUID(),
          workflowId: wfId,
          kind: node.kind!,
          name: node.name!,
          nodeConfig: node.nodeConfig as any,
          uiConfig: { position: node.position! },
        } as any);
      }

      // Re-insert Edges
      for (const edge of wf.edges) {
        await db.insert(WorkflowEdgeTable as any).values({
          id: edge.id || generateUUID(),
          workflowId: wfId,
          source: edge.source!,
          target: edge.target!,
        } as any);
      }
    } else {
      // CREATE New Workflow
      process.stdout.write(`C`);
      const newWfId = generateUUID();

      await db.insert(WorkflowTable as any).values({
        id: newWfId,
        name: wf.name!,
        description: wf.description,
        icon: {
          type: "emoji",
          value: typeof wf.icon === "string" ? wf.icon : "⚡",
          style: { backgroundColor: "#ffffff" },
        } as any,
        userId: systemUserId,
        teamId: null,
        visibility: "public", // Force public for static examples
        isPublished: true, // Assuming boolean based on seed script, though schema defines might differ check line 141 of seed-new-prod-db
        tags: ["example"],
      } as any);

      // Insert Nodes
      for (const node of wf.nodes) {
        await db.insert(WorkflowNodeDataTable as any).values({
          id: node.id || generateUUID(),
          workflowId: newWfId,
          kind: node.kind!,
          name: node.name!,
          nodeConfig: node.nodeConfig as any,
          uiConfig: { position: node.position! },
        } as any);
      }

      // Insert Edges
      for (const edge of wf.edges) {
        await db.insert(WorkflowEdgeTable as any).values({
          id: edge.id || generateUUID(),
          workflowId: newWfId,
          source: edge.source!,
          target: edge.target!,
        } as any);
      }
    }
  }
  console.log(" Done.");

  console.log("\n✅ Sync Completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Sync Failed:", err);
  process.exit(1);
});
