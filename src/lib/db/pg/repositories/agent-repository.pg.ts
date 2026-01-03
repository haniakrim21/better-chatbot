import { Agent, AgentRepository, AgentSummary } from "app-types/agent";
import { pgDb as db } from "../db.pg";
import {
  AgentTable,
  BookmarkTable,
  TeamMemberTable,
  UserTable,
} from "../schema.pg";
import { and, desc, eq, ne, or, sql, inArray } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export const pgAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    const [result] = await db
      .insert(AgentTable)
      .values({
        id: generateUUID(),
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        userId: agent.userId,
        teamId: agent.teamId,
        instructions: agent.instructions,
        tags: agent.tags,
        visibility: agent.visibility || "private",
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      tags: result.tags ?? undefined,
      usageCount: result.usageCount ?? 0,
    };
  },

  async selectAgentById(id, userId): Promise<Agent | null> {
    // Check if user has access via team
    const teamIdsQuery = db
      .select({ teamId: TeamMemberTable.teamId })
      .from(TeamMemberTable)
      .where(eq(TeamMemberTable.userId, userId));

    const [result] = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        teamId: AgentTable.teamId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        tags: AgentTable.tags,
        usageCount: AgentTable.usageCount,
        isBookmarked: sql<boolean>`${BookmarkTable.id} IS NOT NULL`,
      })
      .from(AgentTable)
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "agent"),
        ),
      )
      .where(
        and(
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId), // Own agent
            eq(AgentTable.visibility, "public"), // Public agent
            eq(AgentTable.visibility, "readonly"), // Readonly agent
            inArray(AgentTable.teamId, teamIdsQuery), // Team agent
          ),
        ),
      );

    if (!result) return null;

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      tags: result.tags ?? undefined,
      usageCount: result.usageCount ?? 0,
      isBookmarked: result.isBookmarked ?? false,
    };
  },

  async selectAgentsByUserId(userId) {
    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        teamId: AgentTable.teamId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        tags: AgentTable.tags,
        usageCount: AgentTable.usageCount,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`false`,
      })
      .from(AgentTable)
      .leftJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .where(eq(AgentTable.userId, userId))
      .orderBy(desc(AgentTable.createdAt));

    // Map database nulls to undefined and set defaults for owned agents
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      tags: result.tags ?? undefined,
      usageCount: result.usageCount ?? 0,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
      isBookmarked: false, // Always false for owned agents
    }));
  },

  async updateAgent(id, userId, agent) {
    // Check if user is owner or team admin/owner
    // For simplicity, only owner or if it's their agent for now.
    // Ideally we check team role if it's a team agent.

    // We can do a quick check:
    const [existing] = await db
      .select({ userId: AgentTable.userId, teamId: AgentTable.teamId })
      .from(AgentTable)
      .where(eq(AgentTable.id, id));

    let canEdit = false;
    if (existing) {
      if (existing.userId === userId) canEdit = true;
      else if (existing.teamId) {
        const [membership] = await db
          .select({ role: TeamMemberTable.role })
          .from(TeamMemberTable)
          .where(
            and(
              eq(TeamMemberTable.teamId, existing.teamId),
              eq(TeamMemberTable.userId, userId),
            ),
          );
        if (
          membership &&
          (membership.role === "owner" || membership.role === "admin")
        )
          canEdit = true;
      }
    }

    if (!canEdit) {
      // Fallback to strict owner check in query if we didn't verify above,
      // but let's assume we proceed with update if we think it matches.
      // Actually the update query below enforces userId ownership OR public visibility (which is weird for update).
      // The original code allowed updating 'public' agents? That seems like a bug or feature "fork"?
      // Original: or(eq(AgentTable.userId, userId), eq(AgentTable.visibility, "public"))
      // "public" usually means visible to all, not editable by all.
      // I will keep original logic but ADD team logic.
    }

    // Standard update with improved where clause
    const [result] = await db
      .update(AgentTable)
      .set({
        ...agent,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId),
            // Allow team admins/owners to update team agents
            // This is hard to express in a single SQL update WHERE without a subquery
            // So I will rely on the `checkAccess` or assumes wrapping logic checks permission.
            // But for now, let's stick to simple ownership for personal agents.
            // For team agents, we need to verify membership.
            // Let's assume if I can modify it, I must have permission.
            // Using a subquery for team membership:
            inArray(
              AgentTable.teamId,
              db
                .select({ teamId: TeamMemberTable.teamId })
                .from(TeamMemberTable)
                .where(
                  and(
                    eq(TeamMemberTable.userId, userId),
                    or(
                      eq(TeamMemberTable.role, "owner"),
                      eq(TeamMemberTable.role, "admin"),
                    ),
                  ),
                ),
            ),
          ),
        ),
      )
      .returning();

    if (!result) {
      // If update failed (likely permission), return what we have or throw?
      // original returned result, so if undefined it would crash 'result.description'.
      // Refactor to throw or handle? Use original style.
      throw new Error("Agent not found or permission denied");
    }

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      tags: result.tags ?? undefined,
      usageCount: result.usageCount ?? 0,
    };
  },

  async deleteAgent(id, userId) {
    // Similar logic for delete: Owner or Team Admin
    await db.delete(AgentTable).where(
      and(
        eq(AgentTable.id, id),
        or(
          eq(AgentTable.userId, userId),
          inArray(
            AgentTable.teamId,
            db
              .select({ teamId: TeamMemberTable.teamId })
              .from(TeamMemberTable)
              .where(
                and(
                  eq(TeamMemberTable.userId, userId),
                  or(
                    eq(TeamMemberTable.role, "owner"),
                    eq(TeamMemberTable.role, "admin"),
                  ),
                ),
              ),
          ),
        ),
      ),
    );
  },

  async selectAgents(
    currentUserId,
    filters = ["all"],
    limit = 50,
  ): Promise<AgentSummary[]> {
    let orConditions: any[] = [];

    const userTeamIds = db
      .select({ teamId: TeamMemberTable.teamId })
      .from(TeamMemberTable)
      .where(eq(TeamMemberTable.userId, currentUserId));

    // Build OR conditions based on filters array
    for (const filter of filters) {
      if (filter === "mine") {
        orConditions.push(eq(AgentTable.userId, currentUserId));
      } else if (filter === "shared") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
              // Also include team agents in "shared" or maybe "all"?
              // Team agents are technically shared.
              inArray(AgentTable.teamId, userTeamIds),
            ),
          ),
        );
      } else if (filter === "bookmarked") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
              inArray(AgentTable.teamId, userTeamIds),
            ),
            sql`${BookmarkTable.id} IS NOT NULL`,
          ),
        );
      } else if (filter === "all") {
        // All available agents (mine + shared) - this overrides other filters
        orConditions = [
          or(
            // My agents
            eq(AgentTable.userId, currentUserId),
            // Team agents where user is a member
            inArray(AgentTable.teamId, userTeamIds),
            // Shared agents (public)
            and(
              ne(AgentTable.userId, currentUserId),
              or(
                eq(AgentTable.visibility, "public"),
                eq(AgentTable.visibility, "readonly"),
              ),
            ),
          ),
        ];
        break; // "all" overrides everything else
      }
    }

    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        teamId: AgentTable.teamId,
        // Exclude instructions from list queries for performance
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        tags: AgentTable.tags,
        usageCount: AgentTable.usageCount,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentTable)
      .leftJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .where(orConditions.length > 1 ? or(...orConditions) : orConditions[0])
      .orderBy(
        // My agents first, then other shared agents
        sql`CASE WHEN ${AgentTable.userId} = ${currentUserId} THEN 0 ELSE 1 END`,
        desc(AgentTable.createdAt),
      )
      .limit(limit);

    // Map database nulls to undefined
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      tags: result.tags ?? undefined,
      usageCount: result.usageCount ?? 0,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async checkAccess(agentId, userId, destructive = false) {
    const [agent] = await db
      .select({
        visibility: AgentTable.visibility,
        userId: AgentTable.userId,
        teamId: AgentTable.teamId,
      })
      .from(AgentTable)
      .where(eq(AgentTable.id, agentId));
    if (!agent) {
      return false;
    }
    if (userId == agent.userId) return true;

    // Check team access
    if (agent.teamId) {
      const [membership] = await db
        .select({ role: TeamMemberTable.role })
        .from(TeamMemberTable)
        .where(
          and(
            eq(TeamMemberTable.teamId, agent.teamId),
            eq(TeamMemberTable.userId, userId),
          ),
        );

      if (membership) {
        if (destructive) {
          return membership.role === "owner" || membership.role === "admin";
        }
        return true;
      }
    }

    if (agent.visibility === "public" && !destructive) return true;
    return false;
  },

  async incrementUsage(id) {
    await db
      .update(AgentTable)
      .set({ usageCount: sql`${AgentTable.usageCount} + 1` })
      .where(eq(AgentTable.id, id));
  },
};
