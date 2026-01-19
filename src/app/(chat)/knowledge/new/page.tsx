"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { toast } from "sonner";
import { TeamSelector } from "@/components/teams/team-selector";
import { createKnowledgeBase } from "lib/knowledge/actions";
import { authClient } from "auth/client";

export default function CreateKnowledgeBasePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createKnowledgeBase({
        name,
        description,
        teamId: teamId || undefined,
      });
      toast.success("Knowledge Base created");
      router.push("/knowledge");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create knowledge base");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Knowledge Base</h1>
        <p className="text-muted-foreground">
          Create a new knowledge base to store and retrieve documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Engineering Docs"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this knowledge base for?"
          />
        </div>

        <div className="space-y-2">
          <Label>Team Access (Optional)</Label>
          <TeamSelector
            value={teamId}
            onChange={setTeamId}
            className="w-full"
            currentUserId={userId || ""}
          />
          <p className="text-xs text-muted-foreground">
            Assign to a team to share with members.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Knowledge Base"}
          </Button>
        </div>
      </form>
    </div>
  );
}
