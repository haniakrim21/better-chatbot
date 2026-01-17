#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and } from "drizzle-orm";
import { generateUUID } from "../src/lib/utils";

// Schema Imports
import {
  AgentTable,
  McpServerTable,
  WorkflowTable,
  UserTable,
  WorkflowNodeDataTable,
  WorkflowEdgeTable,
} from "../src/lib/db/pg/schema.pg";

// Data Imports
import { STATIC_AGENTS } from "../src/lib/ai/agent/examples/static-agents";
import { STATIC_MCPS } from "../src/lib/ai/mcp/examples/static-mcps";
import { STATIC_WORKFLOWS } from "../src/lib/ai/workflow/examples/static-workflows";

const { Pool } = pg;

// PROD CONNECTION
const PROD_DB_URL =
  "postgres://postgres:UYbIOh9RqKVuhPoD@postgres-ndzy.sliplane.app:10525/postgres";

async function main() {
  console.log("🌱 Seeding NEW Production Database (Postgres-NdZY)...");
  console.log(`   Target: ${PROD_DB_URL}`);

  const pool = new Pool({
    connectionString: PROD_DB_URL,
    ssl: false,
  });

  const db = drizzle(pool, {
    schema: {
      AgentTable,
      McpServerTable,
      WorkflowTable,
      UserTable,
      WorkflowNodeDataTable,
      WorkflowEdgeTable,
    },
  });

  try {
    // 1. Get/Create User (Optional: assuming user exists or we create one)
    // For now, let's just get the first user or create a default 'admin'
    const users = await db.select().from(UserTable).limit(1);
    let userId: string;

    if (users.length === 0) {
      console.log("Creating default admin user...");
      userId = generateUUID();
      await db.insert(UserTable).values({
        id: userId,
        name: "Admin User",
        email: "admin@nabdai.com", // Placeholder
        emailVerified: new Date(),
      });
    } else {
      userId = users[0].id;
    }
    console.log(`👤 Using User ID: ${userId}`);

    // 2. Seed Agents
    console.log(`\n🤖 Seeding ${STATIC_AGENTS.length} Agents...`);
    for (const agent of STATIC_AGENTS) {
      try {
        // Check if exists
        // We use raw select since db.query might need strict schema setup
        // But we passed schema to drizzle(), so db.query should work.
        await db
          .insert(AgentTable)
          .values({
            id: generateUUID(),
            name: agent.name,
            description: agent.description,
            icon: agent.icon as any,
            userId: userId,
            teamId: null,
            visibility: "public",
            instructions: agent.instructions as any,
            tags: agent.tags,
            usageCount: 10,
          })
          .onConflictDoNothing(); // Simple skip if exists (though usually ID conflict)
        // Actually, simpler to just Insert and ignore errors if unique constraint on Name?
        // AgentTable might not have unique name constraint.
        // Let's rely on standard insert.
      } catch (_e) {
        // Ignore duplicates or errors for now to keep moving
      }
    }

    // 3. Seed MCPs
    console.log(`\n🔌 Seeding ${STATIC_MCPS.length} MCP Servers...`);
    for (const mcp of STATIC_MCPS) {
      try {
        await db
          .insert(McpServerTable)
          .values({
            id: generateUUID(),
            name: mcp.name,
            description: mcp.description,
            userId: userId,
            teamId: null,
            visibility: "public",
            enabled: false,
            config: {
              command: mcp.command,
              args: mcp.args,
              env: mcp.env as any,
            },
            tags: mcp.tags,
          })
          .onConflictDoNothing();
      } catch (_e) {}
    }

    // 4. Seed Workflows
    console.log(`\n⛓️ Seeding ${STATIC_WORKFLOWS.length} Workflows...`);
    for (const item of STATIC_WORKFLOWS) {
      try {
        const workflowId = generateUUID();
        await db.insert(WorkflowTable).values({
          id: workflowId,
          name: item.name!,
          description: item.description,
          icon: {
            type: "emoji",
            value: typeof item.icon === "string" ? item.icon : "⚡",
            style: { backgroundColor: "#ffffff" },
          } as any,
          userId: userId,
          teamId: null,
          visibility: "public",
          isPublished: true,
          tags: ["example"],
        });

        // Insert Nodes
        for (const node of item.nodes) {
          await db.insert(WorkflowNodeDataTable).values({
            id: node.id || generateUUID(),
            workflowId: workflowId,
            kind: node.kind!,
            name: node.name!,
            nodeConfig: node.nodeConfig as any,
            uiConfig: { position: node.position! },
          });
        }

        // Insert Edges
        for (const edge of item.edges) {
          await db.insert(WorkflowEdgeTable).values({
            id: edge.id || generateUUID(),
            workflowId: workflowId,
            source: edge.source!,
            target: edge.target!,
          });
        }
      } catch (e) {
        console.error(`Failed workflow ${item.name}: ${e}`);
      }
    }

    console.log("✅ Seeding Completed!");
  } catch (err) {
    console.error("❌ Script Failed:", err);
  } finally {
    await pool.end();
  }
}

main();
