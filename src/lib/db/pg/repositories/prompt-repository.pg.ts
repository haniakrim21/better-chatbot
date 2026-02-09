import { and, desc, eq, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { PromptEntity, PromptTable } from "../schema.pg";

export type PromptInsert = {
  title: string;
  content: string;
  tags?: string[];
  userId: string;
};

export type PromptUpdate = {
  title?: string;
  content?: string;
  tags?: string[];
};

export const pgPromptRepository = {
  async insert(prompt: PromptInsert): Promise<PromptEntity> {
    const [result] = await db
      .insert(PromptTable)
      .values({
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags ?? [],
        userId: prompt.userId,
      })
      .returning();
    return result;
  },

  async selectByUserId(userId: string): Promise<PromptEntity[]> {
    return db
      .select()
      .from(PromptTable)
      .where(eq(PromptTable.userId, userId))
      .orderBy(desc(PromptTable.updatedAt));
  },

  async selectById(id: string, userId: string): Promise<PromptEntity | null> {
    const [result] = await db
      .select()
      .from(PromptTable)
      .where(and(eq(PromptTable.id, id), eq(PromptTable.userId, userId)));
    return result ?? null;
  },

  async update(
    id: string,
    userId: string,
    data: PromptUpdate,
  ): Promise<PromptEntity> {
    const [result] = await db
      .update(PromptTable)
      .set({
        ...data,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(PromptTable.id, id), eq(PromptTable.userId, userId)))
      .returning();
    return result;
  },

  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(PromptTable)
      .where(and(eq(PromptTable.id, id), eq(PromptTable.userId, userId)));
  },
};
