"use server";

import { pgDb as db } from "@/lib/db/pg/db.pg";
import {
  KnowledgeBaseTable,
  DocumentTable,
  DocumentChunkTable,
  TeamMemberTable,
  TeamTable,
} from "@/lib/db/pg/schema.pg";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import { chunkText } from "@/lib/rag/process-document";
import { revalidatePath } from "next/cache";
import { eq, desc, or, and, inArray, sql } from "drizzle-orm";

export async function getKnowledgeBases(userId: string) {
  console.log("Fetching knowledge bases for user:", userId);
  try {
    const teamMembers = await db
      .select({ teamId: TeamMemberTable.teamId })
      .from(TeamMemberTable)
      .where(eq(TeamMemberTable.userId, userId));

    const teamIds = teamMembers.map((t) => t.teamId);
    console.log("User team IDs:", teamIds);

    const results = await db
      .select({
        id: KnowledgeBaseTable.id,
        name: KnowledgeBaseTable.name,
        description: KnowledgeBaseTable.description,
        userId: KnowledgeBaseTable.userId,
        teamId: KnowledgeBaseTable.teamId,
        createdAt: KnowledgeBaseTable.createdAt,
        updatedAt: KnowledgeBaseTable.updatedAt,
        // Optional: Join with Team to get team name if needed
        teamName: TeamTable.name,
      })
      .from(KnowledgeBaseTable)
      .leftJoin(TeamTable, eq(KnowledgeBaseTable.teamId, TeamTable.id))
      .where(
        teamIds.length > 0
          ? or(
              eq(KnowledgeBaseTable.userId, userId),
              inArray(KnowledgeBaseTable.teamId, teamIds),
            )
          : eq(KnowledgeBaseTable.userId, userId),
      )
      .orderBy(desc(KnowledgeBaseTable.createdAt));

    console.log("Found KBs:", results.length);
    return results;
  } catch (error) {
    console.error("Error in getKnowledgeBases:", error);
    throw error;
  }
}

import { getSession } from "@/lib/auth/server";

export async function createKnowledgeBase(data: {
  name: string;
  description?: string;
  teamId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  await db.insert(KnowledgeBaseTable).values({
    userId,
    name: data.name,
    description: data.description,
    teamId: data.teamId,
  });
  revalidatePath("/knowledge");
}

export async function deleteKnowledgeBase(id: string, userId: string) {
  // Ensure ownership or team admin
  const [kb] = await db
    .select()
    .from(KnowledgeBaseTable)
    .where(eq(KnowledgeBaseTable.id, id));

  if (!kb) return;

  let canDelete = false;
  if (kb.userId === userId) {
    canDelete = true;
  } else if (kb.teamId) {
    const [membership] = await db
      .select({ role: TeamMemberTable.role })
      .from(TeamMemberTable)
      .where(
        and(
          eq(TeamMemberTable.teamId, kb.teamId),
          eq(TeamMemberTable.userId, userId),
        ),
      );
    if (
      membership &&
      (membership.role === "owner" || membership.role === "admin")
    ) {
      canDelete = true;
    }
  }

  if (canDelete) {
    await db.delete(KnowledgeBaseTable).where(eq(KnowledgeBaseTable.id, id));
    revalidatePath("/knowledge");
  }
}

export async function getDocuments(
  knowledgeBaseId: string,
  parentId?: string | null,
) {
  const conditions = [eq(DocumentTable.knowledgeBaseId, knowledgeBaseId)];

  if (parentId) {
    conditions.push(eq(DocumentTable.parentId, parentId));
  } else {
    // If no parentId is provided, fetch root items (parentId is null)
    conditions.push(sql`${DocumentTable.parentId} IS NULL`);
  }

  return await db
    .select()
    .from(DocumentTable)
    .where(and(...conditions))
    .orderBy(desc(DocumentTable.isFolder), desc(DocumentTable.createdAt));
}

export async function createFolder(
  knowledgeBaseId: string,
  name: string,
  parentId?: string | null,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.insert(DocumentTable).values({
    knowledgeBaseId,
    name,
    type: "folder",
    isFolder: true,
    parentId: parentId || null,
    size: 0,
    status: "completed",
  });
  revalidatePath(`/knowledge/${knowledgeBaseId}`);
}

export async function createFile(
  knowledgeBaseId: string,
  name: string,
  content: string,
  parentId?: string | null,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Create Document entry
  const [doc] = await db
    .insert(DocumentTable)
    .values({
      knowledgeBaseId,
      name,
      type: "text/plain",
      isFolder: false,
      parentId: parentId || null,
      size: Buffer.byteLength(content, "utf-8"),
      status: "processing",
    })
    .returning();

  try {
    const chunks = chunkText(content);
    const embeddings = await generateEmbeddings(chunks);

    const chunkRecords = chunks.map((chunkContent, i) => ({
      documentId: doc.id,
      content: chunkContent,
      embedding: embeddings[i],
      metadata: { index: i },
    }));

    if (chunkRecords.length > 0) {
      await db.insert(DocumentChunkTable).values(chunkRecords);
    }

    await db
      .update(DocumentTable)
      .set({ status: "completed" })
      .where(eq(DocumentTable.id, doc.id));
  } catch (error) {
    console.error("Failed to embed created file", error);
    await db
      .update(DocumentTable)
      .set({
        status: "error",
        error: error instanceof Error ? error.message : "Embedding failed",
      })
      .where(eq(DocumentTable.id, doc.id));
  }

  revalidatePath(`/knowledge/${knowledgeBaseId}`);
}

export async function getKnowledgeBase(id: string, userId: string) {
  // Fetch KB and check permissions
  // Logic similarities to deleteKnowledgeBase but for read access
  const teamMembers = await db
    .select({ teamId: TeamMemberTable.teamId })
    .from(TeamMemberTable)
    .where(eq(TeamMemberTable.userId, userId));

  const teamIds = teamMembers.map((t) => t.teamId);

  const [kb] = await db
    .select()
    .from(KnowledgeBaseTable)
    .where(
      and(
        eq(KnowledgeBaseTable.id, id),
        teamIds.length > 0
          ? or(
              eq(KnowledgeBaseTable.userId, userId),
              inArray(KnowledgeBaseTable.teamId, teamIds),
            )
          : eq(KnowledgeBaseTable.userId, userId),
      ),
    );

  return kb;
}

export async function getDocument(id: string) {
  const [doc] = await db
    .select()
    .from(DocumentTable)
    .where(eq(DocumentTable.id, id));
  return doc;
}
