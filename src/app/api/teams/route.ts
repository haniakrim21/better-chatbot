import { auth } from "auth/auth-instance";
import { pgDb as db } from "lib/db/pg/db.pg";
import { TeamMemberTable, TeamTable } from "lib/db/pg/schema.pg";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTeamSchema.parse(body);

    const [team] = await db
      .insert(TeamTable)
      .values({
        name: validated.name,
        description: validated.description,
        ownerId: session.user.id,
      })
      .returning();

    // Add creator as owner in TeamMemberTable
    await db.insert(TeamMemberTable).values({
      teamId: team.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const _members = await db.query.TeamMemberTable.findMany({
      where: eq(TeamMemberTable.userId, session.user.id),
      with: {
        // @ts-ignore - relation needs to be defined in relations definition file if using query builder fully,
        // but for now we might need to join manually if relations aren't set up.
        // Let's use a manual join approach or standard query if relations are missing.
      },
    });

    // Manual join to get team details
    // Since we didn't add the `relations` definitions in a separate file or schema file yet (usually in `relations.ts` or part of schema),
    // let's do a raw join or separate queries. Better: standard join.

    const teams = await db
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
      .where(eq(TeamMemberTable.userId, session.user.id));

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}
