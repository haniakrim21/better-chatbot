import { getSession } from "auth/server";
import { chatRepository } from "lib/db/repository";

import { pgDb as db } from "lib/db/pg/db.pg";
import { TeamMemberTable } from "lib/db/pg/schema.pg";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId") || null;

  if (teamId) {
    const [membership] = await db
      .select()
      .from(TeamMemberTable)
      .where(
        and(
          eq(TeamMemberTable.teamId, teamId),
          eq(TeamMemberTable.userId, session.user.id),
        ),
      );

    if (!membership) {
      return new Response("Unauthorized Team Access", { status: 403 });
    }
  }

  const threads = await chatRepository.selectThreadsByUserId(
    session.user.id,
    teamId,
  );
  return Response.json(threads);
}
