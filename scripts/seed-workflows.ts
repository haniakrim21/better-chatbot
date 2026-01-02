import "dotenv/config";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { UserTable, WorkflowTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
// import { NodeKind } from "../src/lib/ai/workflow/workflow.interface";

async function main() {
  console.log("Seeding popular workflows...");

  const workflows = [
    {
      name: "Article Summarizer",
      description:
        "Extracts main points from an article URL and generates a concise summary.",
      icon: { type: "emoji", value: "📝" } as const,
      isPublished: true,
      visibility: "public" as const,
      instructions: "Input a URL, fetch content, summarize using LLM.",
    },
    {
      name: "Code Reviewer",
      description:
        "Analyzes code snippets for bugs, security issues, and style improvements.",
      icon: { type: "emoji", value: "🧑‍💻" } as const,
      isPublished: true,
      visibility: "public" as const,
      instructions: "Input code, run analysis prompt, output review.",
    },
    {
      name: "Tweet Generator",
      description: "Creates engaging tweets from a topic or short text.",
      icon: { type: "emoji", value: "🐦" } as const,
      isPublished: true,
      visibility: "public" as const,
      instructions: "Input topic, generate 3 tweet variations.",
    },
    {
      name: "Translation Pipeline",
      description:
        "Translates text into multiple languages sequentially (En -> Es -> Fr -> En) to check consistency.",
      icon: { type: "emoji", value: "🌐" } as const,
      isPublished: true,
      visibility: "public" as const,
      instructions: "Input text, translate chain.",
    },
    {
      name: "Meeting Notes Extractor",
      description:
        "Parses raw meeting transcript and extracts action items and key decisions.",
      icon: { type: "emoji", value: "📅" } as const,
      isPublished: true,
      visibility: "public" as const,
      instructions: "Input transcript, extract JSON.",
    },
  ];

  // Get a usage count of available users to assign ownership (using first user found)
  const users = await pgDb.select().from(UserTable).limit(1);
  if (users.length === 0) {
    console.error("No users found. Please seed users first.");
    process.exit(1);
  }
  const userId = users[0].id;

  for (const wf of workflows) {
    const existing = await pgDb
      .select()
      .from(WorkflowTable)
      .where(eq(WorkflowTable.name, wf.name));

    if (existing.length === 0) {
      // Create basic workflow entry
      // Note: We are not seeding Nodes/Edges for simplicity, just the metadata for Discover.
      // In a real scenario, we'd add nodes/edges.
      await pgDb.insert(WorkflowTable).values({
        name: wf.name,
        description: wf.description,
        icon: wf.icon,
        isPublished: wf.isPublished,
        visibility: wf.visibility,
        userId: userId,
        version: "1.0.0",
      });
      console.log(`Created workflow: ${wf.name}`);
    } else {
      console.log(`Workflow already exists: ${wf.name}`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
