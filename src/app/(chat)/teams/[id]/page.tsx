import { getSession } from "lib/auth/server";
import { getTeam, getTeamMembers } from "lib/teams/actions";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { TeamMemberList } from "@/components/teams/team-member-list";

export default async function TeamDetailsPage({
  params,
}: {
  params: { id: string };
}) {
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
            <h3 className="font-semibold mb-2">Team Info</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(team.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize">{userRole}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">Team Resources</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Agents and Knowledge Bases shared with this team.
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
                <Link href={`/knowledge?team=${team.id}`}>
                  View Team Knowledge
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
