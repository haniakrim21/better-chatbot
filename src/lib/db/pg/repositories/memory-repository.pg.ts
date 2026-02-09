import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { UserMemoryEntity, UserMemoryTable } from "../schema.pg";

export type MemoryInsert = {
  userId: string;
  content: string;
  category?: string;
  source?: string;
};

export const pgMemoryRepository = {
  async insert(memory: MemoryInsert): Promise<UserMemoryEntity> {
    const [result] = await db
      .insert(UserMemoryTable)
      .values({
        userId: memory.userId,
        content: memory.content,
        category: memory.category || "general",
        source: memory.source,
      })
      .returning();
    return result;
  },

  async selectByUserId(userId: string): Promise<UserMemoryEntity[]> {
    return db
      .select()
      .from(UserMemoryTable)
      .where(eq(UserMemoryTable.userId, userId))
      .orderBy(desc(UserMemoryTable.updatedAt));
  },

  async selectByCategory(
    userId: string,
    category: string,
  ): Promise<UserMemoryEntity[]> {
    return db
      .select()
      .from(UserMemoryTable)
      .where(
        and(
          eq(UserMemoryTable.userId, userId),
          eq(UserMemoryTable.category, category),
        ),
      )
      .orderBy(desc(UserMemoryTable.updatedAt));
  },

  async search(userId: string, query: string): Promise<UserMemoryEntity[]> {
    return db
      .select()
      .from(UserMemoryTable)
      .where(
        and(
          eq(UserMemoryTable.userId, userId),
          ilike(UserMemoryTable.content, `%${query}%`),
        ),
      )
      .orderBy(desc(UserMemoryTable.updatedAt))
      .limit(20);
  },

  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(UserMemoryTable)
      .where(
        and(eq(UserMemoryTable.id, id), eq(UserMemoryTable.userId, userId)),
      );
  },

  async deleteAll(userId: string): Promise<void> {
    await db.delete(UserMemoryTable).where(eq(UserMemoryTable.userId, userId));
  },

  async update(
    id: string,
    userId: string,
    content: string,
  ): Promise<UserMemoryEntity> {
    const [result] = await db
      .update(UserMemoryTable)
      .set({
        content,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(eq(UserMemoryTable.id, id), eq(UserMemoryTable.userId, userId)),
      )
      .returning();
    return result;
  },

  async count(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(UserMemoryTable)
      .where(eq(UserMemoryTable.userId, userId));
    return Number(result.count);
  },
};
