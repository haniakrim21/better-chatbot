import "dotenv/config";
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import { AgentTable, UserTable } from "../src/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Seeding Discover Agents...");

  // Find a user to own the agents (admin or first user)
  // In a real scenario, you might want a specific 'System' user.
  // We'll try to find an admin or just the first user.
  const users = await db.select().from(UserTable).limit(1);
  if (users.length === 0) {
    console.error("No users found. Create a user first.");
    process.exit(1);
  }
  const userId = users[0].id;
  console.log(`Assigning agents to user ID: ${userId} (${users[0].name})`);

  try {
    const indexUrl = "https://chat-agents.lobehub.com/index.json";
    const indexRes = await fetch(indexUrl);
    if (!indexRes.ok) throw new Error("Failed to fetch agent index");

    const indexData = await indexRes.json();
    const agentsList = indexData.agents.slice(0, 100); // Top 100

    let addedCount = 0;
    let skippedCount = 0;

    for (const agententry of agentsList) {
      const identifier = agententry.identifier;
      const agentUrl = `https://chat-agents.lobehub.com/${identifier}.json`;

      try {
        const agentRes = await fetch(agentUrl);
        if (!agentRes.ok) {
          console.warn(`Failed to fetch details for ${identifier}`);
          continue;
        }

        const agentData = await agentRes.json();
        const meta = agentData.meta;
        const config = agentData.config;

        if (!meta || !meta.title) continue;

        const name = meta.title;

        // Check if exists
        const existing = await db.query.AgentTable.findFirst({
          where: and(
            eq(AgentTable.name, name),
            eq(AgentTable.visibility, "public"),
          ),
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Prepare Icon
        let icon = { type: "emoji", value: "🤖" };
        if (meta.avatar) {
          if (isActiveEmoji(meta.avatar)) {
            icon = { type: "emoji", value: meta.avatar };
          } else {
            icon = { type: "image", value: meta.avatar };
          }
        }

        // Prepare instructions
        const instructions = config?.systemRole
          ? [
              {
                type: "text",
                content: config.systemRole,
              },
            ]
          : [];

        // Prepare tags
        const tags = meta.tags || [];

        // Add category to tags if present
        if (meta.category) {
          tags.push(meta.category);
        }

        await db.insert(AgentTable).values({
          name: name,
          description: meta.description || "",
          icon: icon as any,
          userId: userId,
          visibility: "public",
          instructions: instructions as any,
          tags: tags,
          usageCount: Math.floor(Math.random() * 500) + 10,
        });

        addedCount++;
        process.stdout.write(".");
      } catch (err) {
        console.error(`\nFailed to seed agent ${identifier}`, err);
      }
    }

    console.log(
      `\n\nSeeding complete! Added: ${addedCount}, Skipped: ${skippedCount}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

function isActiveEmoji(str: string) {
  const regex =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
  return regex.test(str) && str.length < 5;
}

main();
