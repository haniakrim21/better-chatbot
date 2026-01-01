import { getSession } from "lib/auth/server";
import { getTeams } from "lib/teams/actions";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import Link from "next/link";
import { PlusIcon, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const teams = await getTeams(session.user.id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others.
          </p>
        </div>
        <Link href="/teams/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </Link>
      </div>

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

        {teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{team.name}</span>
                  <span className="text-xs font-normal px-2 py-1 rounded bg-secondary text-secondary-foreground">
                    {team.role}
                  </span>
                </CardTitle>
                <CardDescription>
                  {team.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
