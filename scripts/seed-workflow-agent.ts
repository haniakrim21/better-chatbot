import "dotenv/config";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { AgentTable, UserTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function main() {
  console.log("Seeding Workflow Creator agent...");

  try {
    // 1. Get a user to assign the agent to
    const user = await pgDb.query.UserTable.findFirst();

    if (!user) {
      console.error(
        "No users found in database. Please sign up or seed users first.",
      );
      process.exit(1);
    }

    console.log(`Using user: ${user.email} (${user.id})`);

    // 2. Check if agent exists
    const existing = await pgDb.query.AgentTable.findFirst({
      where: eq(AgentTable.name, "Workflow Creator"),
    });

    if (existing) {
      console.log(
        "Workflow Creator agent already exists. Updating to ensure correctness...",
      );
      await pgDb
        .update(AgentTable)
        .set({
          visibility: "public",
          instructions: {
            role: "system",
            systemPrompt:
              "You are a Workflow Creator assistant. Your goal is to help users design, modify, and manage workflows using the provided tools.\n\n" +
              "Capabilities:\n" +
              "- Create new workflows.\n" +
              "- Update the structure (nodes and edges) of an existing workflow using `UpdateWorkflowStructure`.\n" +
              "- List and retrieve details of existing workflows.\n\n" +
              "When helping with an existing workflow, always use `GetWorkflowStructure` first to understand the current state before making modifications. " +
              "Always ensure the workflow remains a valid directed graph.",
            mentions: [{ type: "defaultTool", name: "workflow" }],
          },
          updatedAt: new Date(),
        })
        .where(eq(AgentTable.id, existing.id));
      console.log("Agent updated successfully.");
      return;
    }

    // 3. Create Agent
    console.log("Creating Workflow Creator agent...");

    await pgDb.insert(AgentTable).values({
      id: randomUUID(),
      name: "Workflow Creator",
      description:
        "An AI assistant specialized in creating and managing workflows.",
      icon: { type: "emoji", value: "🤖" },
      userId: user.id,
      // teamId: null, // Optional
      instructions: {
        role: "system",
        systemPrompt:
          "You are a Workflow Creator assistant. Your goal is to help users design, modify, and manage workflows using the provided tools.\n\n" +
          "Capabilities:\n" +
          "- Create new workflows.\n" +
          "- Update the structure (nodes and edges) of an existing workflow using `UpdateWorkflowStructure`.\n" +
          "- List and retrieve details of existing workflows.\n\n" +
          "When helping with an existing workflow, always use `GetWorkflowStructure` first to understand the current state before making modifications. " +
          "Always ensure the workflow remains a valid directed graph.",
        mentions: [{ type: "defaultTool", name: "workflow" }],
      },
      tags: ["workflow", "system"],
      visibility: "public", // Make it public so everyone can see it
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Workflow Creator agent created successfully!");
  } catch (error) {
    console.error("Error seeding agent:", error);
    process.exit(1);
  }
}

main();
