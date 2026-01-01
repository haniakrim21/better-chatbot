"use server";

import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TeamTable, TeamMemberTable, UserTable } from "@/lib/db/pg/schema.pg";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

import { getSession } from "@/lib/auth/server";

export async function getTeams() {
  const session = await getSession();
  if (!session) return [];
  const userId = session.user.id;

  return await db
    .select({
      id: TeamTable.id,
      name: TeamTable.name,
      description: TeamTable.description,
      ownerId: TeamTable.ownerId,
      createdAt: TeamTable.createdAt,
      role: TeamMemberTable.role,
    })
    .from(TeamMemberTable)
    .innerJoin(TeamTable, eq(TeamMemberTable.teamId, TeamTable.id))
    .where(eq(TeamMemberTable.userId, userId))
    .orderBy(desc(TeamTable.createdAt));
}

export async function getTeam(teamId: string, userId: string) {
  // Check membership
  const membership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, userId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (!membership) return null;

  return await db.query.TeamTable.findFirst({
    where: eq(TeamTable.id, teamId),
  });
}

export async function getTeamMembers(teamId: string, userId: string) {
  // Check membership
  const membership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, userId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (!membership) return [];

  return await db
    .select({
      id: TeamMemberTable.id,
      role: TeamMemberTable.role,
      joinedAt: TeamMemberTable.createdAt,
      user: {
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        image: UserTable.image,
      },
    })
    .from(TeamMemberTable)
    .innerJoin(UserTable, eq(TeamMemberTable.userId, UserTable.id))
    .where(eq(TeamMemberTable.teamId, teamId));
}

export async function createTeam(data: { name: string; description?: string }) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;

  const [team] = await db
    .insert(TeamTable)
    .values({
      name: data.name,
      description: data.description,
      ownerId: userId,
    })
    .returning();

  await db.insert(TeamMemberTable).values({
    teamId: team.id,
    userId: userId,
    role: "owner",
  });

  revalidatePath("/teams");
  return team;
}

export async function inviteMember(
  inviterId: string,
  teamId: string,
  email: string,
  role: "admin" | "member" = "member",
) {
  // Verify inviter is admin/owner
  const membership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, inviterId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    throw new Error("Permission denied");
  }

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if exists
  const existing = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, user.id),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (existing) {
    throw new Error("User is already a member");
  }

  await db.insert(TeamMemberTable).values({
    teamId,
    userId: user.id,
    role,
  });

  revalidatePath(`/teams/${teamId}`);
}
