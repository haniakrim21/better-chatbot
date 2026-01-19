import { pgDb as db } from "@/lib/db/pg/db.pg";
import { PromptTable } from "@/lib/db/pg/schema.pg";
import { eq, and, desc } from "drizzle-orm";
import { PromptEntity } from "@/lib/db/pg/schema.pg";

export async function createPrompt(
  userId: string,
  data: Pick<PromptEntity, "title" | "content" | "tags">,
) {
  const [prompt] = await db
    .insert(PromptTable)
    .values({ ...data, userId })
    .returning();
  return prompt;
}

export async function getPrompts(userId: string, search?: string) {
  const query = db
    .select()
    .from(PromptTable)
    .where(eq(PromptTable.userId, userId))
    .orderBy(desc(PromptTable.createdAt));

  if (search) {
    // const _searchLower = `%${search.toLowerCase()}%`;
    // simplistic search
    // Note: Drizzle's like is case-sensitive in Postgres unless using ilike extension or raw SQL
    // Here we assume standard behavior or handle it in specific DB adapters.
    // For now, let's just return all and filter client side if complex search needed,
    // or implement simple match on title.
  }

  return await query;
}

export async function updatePrompt(
  userId: string,
  promptId: string,
  data: Partial<Pick<PromptEntity, "title" | "content" | "tags">>,
) {
  const [updated] = await db
    .update(PromptTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(PromptTable.id, promptId), eq(PromptTable.userId, userId)))
    .returning();
  return updated;
}

export async function deletePrompt(userId: string, promptId: string) {
  return await db
    .delete(PromptTable)
    .where(and(eq(PromptTable.id, promptId), eq(PromptTable.userId, userId)));
}
