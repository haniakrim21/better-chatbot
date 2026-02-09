import { formatDistanceToNow } from "date-fns";
import { sql } from "drizzle-orm";
import {
  Database,
  FileText,
  HardDrive,
  Lock,
  PlusIcon,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { DocumentTable } from "@/lib/db/pg/schema.pg";
import { getKnowledgeBases } from "@/lib/knowledge/actions";

export const dynamic = "force-dynamic";

async function getDocumentStats(kbIds: string[]) {
  if (kbIds.length === 0) return {};
  const rows = await db
    .select({
      knowledgeBaseId: DocumentTable.knowledgeBaseId,
      docCount: sql<number>`count(*)`.as("doc_count"),
      totalSize: sql<number>`coalesce(sum(${DocumentTable.size}), 0)`.as(
        "total_size",
      ),
    })
    .from(DocumentTable)
    .where(sql`${DocumentTable.knowledgeBaseId} IN ${kbIds}`)
    .groupBy(DocumentTable.knowledgeBaseId);

  return Object.fromEntries(
    rows.map((r) => [
      r.knowledgeBaseId,
      { docCount: Number(r.docCount), totalSize: Number(r.totalSize) },
    ]),
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  }

  const kbIds = kbs.map((kb) => kb.id);
  const stats = await getDocumentStats(kbIds);

  const totalDocs = Object.values(stats).reduce(
    (sum, s) => sum + s.docCount,
    0,
  );
  const totalSize = Object.values(stats).reduce(
    (sum, s) => sum + s.totalSize,
    0,
  );

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

      {/* Stats Summary */}
      {kbs.length > 0 && (
        <div className="grid gap-3 grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <Database className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{kbs.length}</p>
              <p className="text-xs text-muted-foreground">Knowledge Bases</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <FileText className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{totalDocs}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <HardDrive className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">{formatSize(totalSize)}</p>
              <p className="text-xs text-muted-foreground">Total Size</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kbs.length === 0 ? (
          <Card className="col-span-full border-dashed p-8 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Database className="h-10 w-10 text-muted-foreground/50" />
              <p>No knowledge bases found. Create one to get started.</p>
              <Link href="/knowledge/new">
                <Button variant="outline" size="sm">
                  <PlusIcon className="me-2 h-3 w-3" /> Create Knowledge Base
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          kbs.map((kb) => {
            const kbStats = stats[kb.id] || { docCount: 0, totalSize: 0 };
            return (
              <Card
                key={kb.id}
                className="hover:bg-muted/50 transition-colors group"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <span className="truncate flex-1">{kb.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {kb.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Document count + size badges */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-secondary/60 px-2 py-0.5 rounded-full">
                      <FileText className="h-3 w-3" />
                      {kbStats.docCount}{" "}
                      {kbStats.docCount === 1 ? "doc" : "docs"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-secondary/60 px-2 py-0.5 rounded-full">
                      <HardDrive className="h-3 w-3" />
                      {formatSize(kbStats.totalSize)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {kb.teamId ? (
                        <>
                          <Users className="h-3 w-3" />
                          {kb.teamName || "Team Shared"}
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Private
                        </>
                      )}
                    </span>
                    <span>
                      {kb.createdAt
                        ? formatDistanceToNow(new Date(kb.createdAt)) + " ago"
                        : ""}
                    </span>
                  </div>
                  <Link
                    href={`/knowledge/${kb.id}`}
                    className="text-primary hover:underline mt-4 block font-medium flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    View Documents
                  </Link>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
