import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { FileText, Folder, ArrowLeft } from "lucide-react";
import {
  getKnowledgeBase,
  getDocuments,
  getDocument,
} from "@/lib/knowledge/actions";
import { getSession } from "@/lib/auth/server";
import { UploadDocument } from "./upload-document";
import { formatDistanceToNow } from "date-fns";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateFileDialog } from "./create-file-dialog";
import Link from "next/link";
import { Button } from "ui/button";

export default async function KnowledgeDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folderId?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const folderId = searchParams.folderId || null;

  const session = await getSession();
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const kb = await getKnowledgeBase(params.id, session.user.id);
  if (!kb) {
    return <div>Knowledge Base Not Found</div>;
  }

  const documents = await getDocuments(kb.id, folderId);
  const currentFolder = folderId ? await getDocument(folderId) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{kb.name}</h2>
          <p className="text-muted-foreground">{kb.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentFolder ? (
          <Button variant="ghost" asChild>
            <Link
              href={
                currentFolder.parentId
                  ? `/knowledge/${kb.id}?folderId=${currentFolder.parentId}`
                  : `/knowledge/${kb.id}`
              }
            >
              <ArrowLeft className="h-4 w-4 me-2" />
              {currentFolder.name}
            </Link>
          </Button>
        ) : (
          <span className="text-sm font-medium text-muted-foreground px-4">
            Root
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <CreateFolderDialog knowledgeBaseId={kb.id} parentId={folderId} />
        <CreateFileDialog knowledgeBaseId={kb.id} parentId={folderId} />
        <UploadDocument knowledgeBaseId={kb.id} parentId={folderId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentFolder ? currentFolder.name : "Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items in this folder.
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                >
                  {doc.isFolder ? (
                    <Folder className="h-4 w-4 me-3 text-blue-500 fill-blue-500/20" />
                  ) : (
                    <FileText className="h-4 w-4 me-3 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    {doc.isFolder ? (
                      <Link
                        href={`/knowledge/${kb.id}?folderId=${doc.id}`}
                        className="text-sm font-medium truncate hover:underline"
                      >
                        {doc.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.createdAt))} ago •{" "}
                      {doc.type || "Unknown type"}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                    {doc.status || "ready"}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
