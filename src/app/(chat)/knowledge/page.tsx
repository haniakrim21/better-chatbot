"use client";

import { Button } from "ui/button"; // verify path
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "ui/card";
import Link from "next/link";
import { PlusIcon, Database } from "lucide-react";

// Mock data for UI dev before actions integration if needed,
// but we will assume data is passed or fetched via client/server component pattern.
// Being a client page, we might fetch via useEffect or use a server component wrapper.
// Let's make this a Server Component if possible, but "use client" is safer for interactivity.
// Actually, standard Next.js app router: Page is Server Component.

// I will make the Page a Server Component and a Client Component for the list/interactions.
export default function KnowledgePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Manage your documents and RAG sources.
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> New Knowledge Base
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* List KBs here. For now placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Default KB
            </CardTitle>
            <CardDescription>Main knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">0 Documents</p>
            <Link
              href="/knowledge/demo-id"
              className="text-primary hover:underline mt-2 block"
            >
              View Documents
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
