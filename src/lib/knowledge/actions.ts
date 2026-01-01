"use server";

import { pgDb as db } from "@/lib/db/pg/db.pg";
import {
  KnowledgeBaseTable,
  DocumentTable,
  TeamMemberTable,
  TeamTable,
} from "@/lib/db/pg/schema.pg";
import { revalidatePath } from "next/cache";
import { eq, desc, or, and, inArray } from "drizzle-orm";

export async function getKnowledgeBases(userId: string) {
  const userTeamIds = db
    .select({ teamId: TeamMemberTable.teamId })
    .from(TeamMemberTable)
    .where(eq(TeamMemberTable.userId, userId));

  return await db
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
      or(
        eq(KnowledgeBaseTable.userId, userId),
        inArray(KnowledgeBaseTable.teamId, userTeamIds),
      ),
    )
    .orderBy(desc(KnowledgeBaseTable.createdAt));
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

export async function getDocuments(knowledgeBaseId: string) {
  return await db
    .select()
    .from(DocumentTable)
    .where(eq(DocumentTable.knowledgeBaseId, knowledgeBaseId))
    .orderBy(desc(DocumentTable.createdAt));
}
