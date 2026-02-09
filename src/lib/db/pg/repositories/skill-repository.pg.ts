import { and, desc, eq, or } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import {
  AgentSkillEntity,
  AgentSkillTable,
  SkillEntity,
  SkillTable,
} from "../schema.pg";

export const pgSkillRepository = {
  insert: async (
    data: Omit<SkillEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<SkillEntity> => {
    const [result] = await db.insert(SkillTable).values(data).returning();
    return result;
  },

  selectByUserId: async (userId: string): Promise<SkillEntity[]> => {
    return db
      .select()
      .from(SkillTable)
      .where(
        or(eq(SkillTable.userId, userId), eq(SkillTable.visibility, "public")),
      )
      .orderBy(desc(SkillTable.createdAt));
  },

  selectById: async (id: string): Promise<SkillEntity | null> => {
    const [result] = await db
      .select()
      .from(SkillTable)
      .where(eq(SkillTable.id, id));
    return result ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<SkillEntity, "id" | "userId" | "createdAt">>,
  ): Promise<SkillEntity | null> => {
    const [result] = await db
      .update(SkillTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(SkillTable.id, id), eq(SkillTable.userId, userId)))
      .returning();
    return result ?? null;
  },

  delete: async (id: string, userId: string): Promise<void> => {
    await db
      .delete(SkillTable)
      .where(and(eq(SkillTable.id, id), eq(SkillTable.userId, userId)));
  },

  // Agent-Skill junction methods
  attachSkill: async (
    agentId: string,
    skillId: string,
  ): Promise<AgentSkillEntity> => {
    const [result] = await db
      .insert(AgentSkillTable)
      .values({ agentId, skillId })
      .onConflictDoNothing()
      .returning();
    return result;
  },

  detachSkill: async (agentId: string, skillId: string): Promise<void> => {
    await db
      .delete(AgentSkillTable)
      .where(
        and(
          eq(AgentSkillTable.agentId, agentId),
          eq(AgentSkillTable.skillId, skillId),
        ),
      );
  },

  selectSkillsByAgentId: async (agentId: string): Promise<SkillEntity[]> => {
    const rows = await db
      .select({ skill: SkillTable })
      .from(AgentSkillTable)
      .innerJoin(SkillTable, eq(AgentSkillTable.skillId, SkillTable.id))
      .where(eq(AgentSkillTable.agentId, agentId));
    return rows.map((r) => r.skill);
  },

  selectAgentSkillIds: async (agentId: string): Promise<string[]> => {
    const rows = await db
      .select({ skillId: AgentSkillTable.skillId })
      .from(AgentSkillTable)
      .where(eq(AgentSkillTable.agentId, agentId));
    return rows.map((r) => r.skillId);
  },
};
