import { auth } from "auth/auth-instance";
import { pgDb as db } from "lib/db/pg/db.pg";
import { TeamMemberTable, TeamTable } from "lib/db/pg/schema.pg";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const updateTeamSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { teamId } = await params;

    // Verify membership
    const membership = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.userId, session.user.id),
        eq(TeamMemberTable.teamId, teamId),
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await db.query.TeamTable.findFirst({
      where: eq(TeamTable.id, teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { teamId } = await params;

    const body = await req.json();
    const validated = updateTeamSchema.parse(body);

    // Verify ownership or admin role
    const membership = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.userId, session.user.id),
        eq(TeamMemberTable.teamId, teamId),
      ),
    });

    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedTeam] = await db
      .update(TeamTable)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(TeamTable.id, teamId))
      .returning();

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { teamId } = await params;

    // Verify ownership - only owner can delete
    const membership = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.userId, session.user.id),
        eq(TeamMemberTable.teamId, teamId),
      ),
    });

    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(TeamTable).where(eq(TeamTable.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}
