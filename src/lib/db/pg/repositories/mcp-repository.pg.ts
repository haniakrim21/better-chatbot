import { pgDb as db } from "../db.pg";
import { McpServerTable, UserTable } from "../schema.pg";
import { eq, or, desc, sql, inArray } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import type { MCPRepository } from "app-types/mcp";

export const pgMcpRepository: MCPRepository = {
  async save(server) {
    const [result] = await db
      .insert(McpServerTable)
      .values({
        id: server.id ?? generateUUID(),
        name: server.name,
        config: server.config,
        userId: server.userId,
        visibility: server.visibility ?? "private",
        tags: server.tags,
        usageCount: server.usageCount ?? 0,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        teamId: undefined, // Default to null/undefined
      })
      .onConflictDoUpdate({
        target: [McpServerTable.id],
        set: {
          config: server.config,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      ...result,
      tags: result.tags ?? undefined,
    };
  },

  async selectById(id) {
    const [result] = await db
      .select()
      .from(McpServerTable)
      .where(eq(McpServerTable.id, id));
    if (!result) return null;
    return {
      ...result,
      tags: result.tags ?? undefined,
    };
  },

  async selectAll(teamIds?: string[]) {
    const results = await db
      .select()
      .from(McpServerTable)
      .where(
        teamIds
          ? or(
              eq(McpServerTable.visibility, "public"),
              teamIds.length > 0
                ? inArray(McpServerTable.teamId, teamIds)
                : undefined,
            )
          : undefined,
      );
    return results.map((result) => ({
      ...result,
      tags: result.tags ?? undefined,
    }));
  },

  async selectAllForUser(userId, teamIds = []) {
    // Get user's own MCP servers, public ones, AND team-shared ones
    const results = await db
      .select({
        id: McpServerTable.id,
        name: McpServerTable.name,
        description: McpServerTable.description,
        config: McpServerTable.config,
        enabled: McpServerTable.enabled,
        userId: McpServerTable.userId,
        teamId: McpServerTable.teamId,
        visibility: McpServerTable.visibility,
        createdAt: McpServerTable.createdAt,
        updatedAt: McpServerTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        tags: McpServerTable.tags,
        usageCount: McpServerTable.usageCount,
      })
      .from(McpServerTable)
      .leftJoin(UserTable, eq(McpServerTable.userId, UserTable.id))
      .where(
        or(
          eq(McpServerTable.userId, userId),
          eq(McpServerTable.visibility, "public"),
          teamIds.length > 0
            ? inArray(McpServerTable.teamId, teamIds)
            : undefined,
        ),
      )
      .orderBy(desc(McpServerTable.createdAt));
    return results.map((result) => ({
      ...result,
      tags: result.tags ?? null,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async updateVisibility(id, visibility) {
    await db
      .update(McpServerTable)
      .set({ visibility, updatedAt: new Date() })
      .where(eq(McpServerTable.id, id));
  },

  async deleteById(id) {
    await db.delete(McpServerTable).where(eq(McpServerTable.id, id));
  },

  async selectByServerName(name) {
    const [result] = await db
      .select()
      .from(McpServerTable)
      .where(eq(McpServerTable.name, name));
    if (!result) return null;
    return {
      ...result,
      tags: result.tags ?? undefined,
    };
  },
  async existsByServerName(name) {
    const [result] = await db
      .select({ id: McpServerTable.id })
      .from(McpServerTable)
      .where(eq(McpServerTable.name, name));

    return !!result;
  },

  async existsByServerNameForUser(name, userId, teamIds = []) {
    const [result] = await db
      .select({ id: McpServerTable.id })
      .from(McpServerTable)
      .where(
        sql`${McpServerTable.name} = ${name} AND (${or(
          eq(McpServerTable.userId, userId),
          eq(McpServerTable.visibility, "public"),
          teamIds.length > 0
            ? inArray(McpServerTable.teamId, teamIds)
            : undefined,
        )})`,
      );

    return !!result;
  },
  async incrementUsage(id) {
    await db
      .update(McpServerTable)
      .set({
        usageCount: sql`${McpServerTable.usageCount} + 1`,
      })
      .where(eq(McpServerTable.id, id));
  },
};
