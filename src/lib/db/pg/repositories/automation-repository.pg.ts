import { and, desc, eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { AutomationEntity, AutomationTable } from "../schema.pg";

export const pgAutomationRepository = {
  insert: async (
    data: Omit<
      AutomationEntity,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "lastRunAt"
      | "lastRunStatus"
      | "lastRunResult"
    >,
  ): Promise<AutomationEntity> => {
    const [result] = await db.insert(AutomationTable).values(data).returning();
    return result;
  },

  selectByUserId: async (userId: string): Promise<AutomationEntity[]> => {
    return db
      .select()
      .from(AutomationTable)
      .where(eq(AutomationTable.userId, userId))
      .orderBy(desc(AutomationTable.createdAt));
  },

  selectById: async (
    id: string,
    userId: string,
  ): Promise<AutomationEntity | null> => {
    const [result] = await db
      .select()
      .from(AutomationTable)
      .where(
        and(eq(AutomationTable.id, id), eq(AutomationTable.userId, userId)),
      );
    return result ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<AutomationEntity, "id" | "userId" | "createdAt">>,
  ): Promise<AutomationEntity | null> => {
    const [result] = await db
      .update(AutomationTable)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(AutomationTable.id, id), eq(AutomationTable.userId, userId)),
      )
      .returning();
    return result ?? null;
  },

  delete: async (id: string, userId: string): Promise<void> => {
    await db
      .delete(AutomationTable)
      .where(
        and(eq(AutomationTable.id, id), eq(AutomationTable.userId, userId)),
      );
  },

  selectEnabled: async (): Promise<AutomationEntity[]> => {
    return db
      .select()
      .from(AutomationTable)
      .where(eq(AutomationTable.enabled, true));
  },
};
