import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "ui/card";
import Link from "next/link";
import { PlusIcon, Database } from "lucide-react";
import { getKnowledgeBases } from "@/lib/knowledge/actions";
import { getSession } from "@/lib/auth/server";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  type KnowledgeBase = Awaited<ReturnType<typeof getKnowledgeBases>>[number];
  let kbs: KnowledgeBase[] = [];
  try {
    kbs = await getKnowledgeBases(session.user.id);
  } catch (error) {
    console.error("Failed to fetch knowledge bases:", error);
    // You might want to return an error UI here, but for now let's just show empty
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Manage your documents and RAG sources.
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button>
            <PlusIcon className="me-2 h-4 w-4" /> New Knowledge Base
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kbs.length === 0 ? (
          <Card className="col-span-full border-dashed p-8 text-center text-muted-foreground">
            No knowledge bases found. Create one to get started.
          </Card>
        ) : (
          kbs.map((kb) => (
            <Card key={kb.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {kb.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {kb.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{kb.teamId ? "Team Shared" : "Private"}</span>
                  <span>
                    {kb.createdAt
                      ? formatDistanceToNow(new Date(kb.createdAt)) + " ago"
                      : ""}
                  </span>
                </div>
                <Link
                  href={`/knowledge/${kb.id}`}
                  className="text-primary hover:underline mt-4 block font-medium"
                >
                  View Documents
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
