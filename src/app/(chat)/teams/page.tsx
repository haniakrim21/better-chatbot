import { getSession } from "lib/auth/server";
import { getTeamMembers, getTeams } from "lib/teams/actions";
import { Calendar, Crown, PlusIcon, Shield, User, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const teams = await getTeams();

  // Fetch member counts + member info for avatar stacks
  const teamDetails = await Promise.all(
    teams.map(async (team) => {
      const members = await getTeamMembers(team.id, session.user.id);
      return {
        ...team,
        memberCount: members.length,
        members: members.slice(0, 5),
      };
    }),
  );

  const totalMembers = teamDetails.reduce((sum, t) => sum + t.memberCount, 0);

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-amber-500" />;
    if (role === "admin") return <Shield className="h-3 w-3 text-blue-500" />;
    return <User className="h-3 w-3 text-muted-foreground" />;
  };

  const roleColor = (role: string) => {
    if (role === "owner")
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (role === "admin")
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others.
          </p>
        </div>
        <Link href="/teams/new">
          <Button>
            <PlusIcon className="me-2 h-4 w-4" /> Create Team
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      {teams.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="font-medium text-foreground">{teams.length}</span>{" "}
            {teams.length === 1 ? "team" : "teams"}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="font-medium text-foreground">{totalMembers}</span>{" "}
            total members
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a team to start collaborating.
            </p>
            <Link href="/teams/new">
              <Button variant="outline">Create Team</Button>
            </Link>
          </div>
        )}

        {teamDetails.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{team.name}</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border flex items-center gap-1 ${roleColor(team.role)}`}
                  >
                    {roleIcon(team.role)}
                    {team.role}
                  </span>
                </CardTitle>
                <CardDescription>
                  {team.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {/* Avatar Stack */}
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 4).map((member) => (
                        <Avatar
                          key={member.id}
                          className="h-7 w-7 border-2 border-background"
                        >
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {member.user.name?.slice(0, 2).toUpperCase() ||
                              "??"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {team.memberCount > 4 && (
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          +{team.memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {team.memberCount}{" "}
                      {team.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>

                  {/* Date */}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
