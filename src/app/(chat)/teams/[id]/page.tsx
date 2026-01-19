import { getSession } from "lib/auth/server";
import { getTeam, getTeamMembers } from "lib/teams/actions";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { TeamDangerZone } from "@/components/teams/team-danger-zone";

export default async function TeamDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const team = await getTeam(params.id, session.user.id);
  if (!team) {
    notFound();
  }

  const members = await getTeamMembers(params.id, session.user.id);

  // Determine current user's role
  const currentUserMembership = members.find(
    (m) => m.user.id === session.user.id,
  );
  const userRole = currentUserMembership?.role || "member";

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/teams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
          <p className="text-muted-foreground">
            {team.description || "No description"}
          </p>
        </div>
        {(userRole === "owner" || userRole === "admin") && (
          <Button variant="outline" size="sm">
            <Settings className="me-2 h-4 w-4" /> Settings
          </Button>
        )}
      </div>

      <Separator />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <TeamMemberList
            teamId={team.id}
            members={members}
            currentUserRole={userRole}
            currentUserId={session.user.id}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">Team Resources</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Resources shared with this team.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/agents?team=${team.id}`}>View Team Agents</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/workflow?team=${team.id}`}>
                  View Team Workflows
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/knowledge?team=${team.id}`}>
                  View Team Knowledge
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/mcp?team=${team.id}`}>View Team MCPs</Link>
              </Button>
            </div>
          </div>

          {userRole === "owner" && <TeamDangerZone teamId={team.id} />}
        </div>
      </div>
    </div>
  );
}
