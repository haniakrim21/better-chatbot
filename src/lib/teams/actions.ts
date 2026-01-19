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
    return { error: "Permission denied" };
  }

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Check if exists
  const existing = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, user.id),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (existing) {
    return { error: "User is already a member" };
  }

  await db.insert(TeamMemberTable).values({
    teamId,
    userId: user.id,
    role,
  });

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function removeMember(teamId: string, targetUserId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const requesterId = session.user.id;

  // Check requester membership
  const requesterMembership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, requesterId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (!requesterMembership) {
    throw new Error("Unauthorized");
  }

  // Check target membership
  const targetMembership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, targetUserId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (!targetMembership) {
    throw new Error("Member not found");
  }

  // Permission Logic
  const isSelf = requesterId === targetUserId;

  if (isSelf) {
    // Leaving the team
    if (requesterMembership.role === "owner") {
      // Check if last owner
      const owners = await db.query.TeamMemberTable.findMany({
        where: and(
          eq(TeamMemberTable.teamId, teamId),
          eq(TeamMemberTable.role, "owner"),
        ),
      });
      if (owners.length === 1) {
        throw new Error("The last owner cannot leave the team.");
      }
    }
  } else {
    // Removing someone else
    if (requesterMembership.role === "member") {
      throw new Error("Permission denied");
    }
    if (
      requesterMembership.role === "admin" &&
      targetMembership.role !== "member"
    ) {
      throw new Error("Admins can only remove members");
    }
    // Owners can remove anyone (including other owners, policy dependent, usually fine or restricted)
    // Assuming Owner can remove anyone for now.
  }

  await db
    .delete(TeamMemberTable)
    .where(
      and(
        eq(TeamMemberTable.teamId, teamId),
        eq(TeamMemberTable.userId, targetUserId),
      ),
    );

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams"); // Refresh list if I left
}

export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  newRole: "admin" | "member",
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const requesterId = session.user.id;

  // Check requester membership
  const requesterMembership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, requesterId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (
    !requesterMembership ||
    (requesterMembership.role !== "owner" &&
      requesterMembership.role !== "admin")
  ) {
    throw new Error("Permission denied");
  }

  // Admin cannot promote/demote other admins or owners?
  // Usually Admin can manage members, but maybe not other admins.
  // Let's stick to: Owner can do anything. Admin can only manage 'member' role?
  // Or simplifying: Admin can generally update roles of members, but cannot touch owners.

  const targetMembership = await db.query.TeamMemberTable.findFirst({
    where: and(
      eq(TeamMemberTable.userId, targetUserId),
      eq(TeamMemberTable.teamId, teamId),
    ),
  });

  if (!targetMembership) {
    throw new Error("Member not found");
  }

  if (targetMembership.role === "owner") {
    throw new Error("Cannot change the role of an owner");
  }

  if (requesterMembership.role === "admin") {
    // Admin trying to update someone
    if (targetMembership.role === "admin") {
      throw new Error("Admins cannot modify other admins");
    }
    if (newRole === "admin") {
      // Admin promoting member to admin?
      // Check if policy allows. Let's assume yes for now, or maybe only Owner can promote to Admin.
      // Common pattern: Admin can only manage members. Owner manages Admins.
      // Let's implement: Admin can only manage Members (remove member).
      // Promoting to Admin should be Owner-only.
      throw new Error("Only owners can promote to admin");
    }
  }

  await db
    .update(TeamMemberTable)
    .set({ role: newRole })
    .where(
      and(
        eq(TeamMemberTable.teamId, teamId),
        eq(TeamMemberTable.userId, targetUserId),
      ),
    );

  revalidatePath(`/teams/${teamId}`);
}

export async function deleteTeam(teamId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  // Verify ownership
  const team = await db.query.TeamTable.findFirst({
    where: eq(TeamTable.id, teamId),
  });

  if (!team) {
    return { error: "Team not found" };
  }

  if (team.ownerId !== userId) {
    return { error: "Permission denied. Only the owner can delete the team." };
  }

  await db.delete(TeamTable).where(eq(TeamTable.id, teamId));

  revalidatePath("/teams");
  revalidatePath("/");
  return { success: true };
}
