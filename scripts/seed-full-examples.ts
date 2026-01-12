import "dotenv/config";
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import {
  AgentTable,
  McpServerTable,
  WorkflowTable,
  UserTable,
  WorkflowNodeDataTable,
  WorkflowEdgeTable,
} from "../src/lib/db/pg/schema.pg";
import { STATIC_AGENTS } from "../src/lib/ai/agent/examples/static-agents";
import { STATIC_MCPS } from "../src/lib/ai/mcp/examples/static-mcps";
import { STATIC_WORKFLOWS } from "../src/lib/ai/workflow/examples/static-workflows";
import { eq, and } from "drizzle-orm";
import { generateUUID } from "../src/lib/utils";

async function main() {
  console.log("🌱 Seeding full examples set...");

  // 1. Get User
  const users = await db.select().from(UserTable).limit(1);
  if (users.length === 0) {
    console.error(
      "❌ No users found. Run default seed first or create a user.",
    );
    process.exit(1);
  }
  const userId = users[0].id;
  const teamId = null; // Adding to personal workspace for now

  console.log(`👤 Assigning to user: ${users[0].name} (${userId})`);

  // 2. Seed Agents
  console.log(`\n🤖 Seeding ${STATIC_AGENTS.length} Agents...`);
  for (const agent of STATIC_AGENTS) {
    try {
      // Check for existing agent by name + userId
      const existing = await db.query.AgentTable.findFirst({
        where: and(
          eq(AgentTable.name, agent.name),
          eq(AgentTable.userId, userId),
        ),
      });

      if (existing) {
        // Update existing
        await db
          .update(AgentTable)
          .set({
            description: agent.description,
            icon: agent.icon as any,
            instructions: agent.instructions as any,
            tags: agent.tags,
            updatedAt: new Date(),
          })
          .where(eq(AgentTable.id, existing.id));
        process.stdout.write("u");
      } else {
        // Insert new
        await db.insert(AgentTable).values({
          name: agent.name,
          description: agent.description,
          icon: agent.icon as any,
          userId: userId,
          teamId: teamId,
          visibility: "public",
          instructions: agent.instructions as any,
          tags: agent.tags,
          usageCount: Math.floor(Math.random() * 100),
        });
        process.stdout.write(".");
      }
    } catch (e) {
      console.error(`\nFailed to seed agent ${agent.name}:`, e);
    }
  }

  // 3. Seed MCPs
  console.log(`\n\n🔌 Seeding ${STATIC_MCPS.length} MCP Servers...`);
  for (const mcp of STATIC_MCPS) {
    try {
      const existing = await db.query.McpServerTable.findFirst({
        where: and(
          eq(McpServerTable.name, mcp.name),
          eq(McpServerTable.userId, userId),
        ),
      });

      if (existing) {
        // Update
        await db
          .update(McpServerTable)
          .set({
            description: mcp.description,
            config: {
              command: mcp.command,
              args: mcp.args,
              env: mcp.env as any,
            },
            tags: mcp.tags,
            updatedAt: new Date(),
          })
          .where(eq(McpServerTable.id, existing.id));
        process.stdout.write("u");
      } else {
        await db.insert(McpServerTable).values({
          name: mcp.name,
          description: mcp.description,
          userId: userId,
          teamId: teamId,
          visibility: "public",
          enabled: false,
          config: {
            command: mcp.command,
            args: mcp.args,
            env: mcp.env as any,
          },
          tags: mcp.tags,
          usageCount: Math.floor(Math.random() * 50),
        });
        process.stdout.write(".");
      }
    } catch (e) {
      console.error(`\nFailed to seed MCP ${mcp.name}:`, e);
    }
  }

  // 4. Seed Workflows
  console.log(`\n\n⛓️ Seeding ${STATIC_WORKFLOWS.length} Workflows...`);
  for (const item of STATIC_WORKFLOWS) {
    try {
      const existing = await db.query.WorkflowTable.findFirst({
        where: and(
          eq(WorkflowTable.name, item.name!),
          eq(WorkflowTable.userId, userId),
        ),
      });

      // For workflows, updating complex nested nodes/edges is hard.
      // Easier to delete and re-create if it exists, to ensure full graph integrity.
      if (existing) {
        await db.delete(WorkflowTable).where(eq(WorkflowTable.id, existing.id));
        process.stdout.write("d");
      }

      const workflowId = generateUUID();
      // Insert Workflow
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
        teamId: teamId,
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
      process.stdout.write(".");
    } catch (e) {
      console.error(`\nFailed to seed workflow ${item.name}:`, e);
    }
  }

  console.log("\n\n✅ Seeding Complete!");
  process.exit(0);
}

main();
