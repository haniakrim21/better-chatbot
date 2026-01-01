import { auth } from "auth/auth-instance";
import { pgDb as db } from "lib/db/pg/db.pg";
import { TeamMemberTable, UserTable } from "lib/db/pg/schema.pg";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
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
    const checkMembership = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.userId, session.user.id),
        eq(TeamMemberTable.teamId, teamId),
      ),
    });

    if (!checkMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await db
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

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const validated = addMemberSchema.parse(body);

    // Verify admin/owner role
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

    // Find user by email
    const userToAdd = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, validated.email),
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found. They must sign up first." },
        { status: 404 },
      );
    }

    // Check if already a member
    const existingMember = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.userId, userToAdd.id),
        eq(TeamMemberTable.teamId, teamId),
      ),
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 },
      );
    }

    const [newMember] = await db
      .insert(TeamMemberTable)
      .values({
        teamId: teamId,
        userId: userToAdd.id,
        role: validated.role,
      })
      .returning();

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }
}
