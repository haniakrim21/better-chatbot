"use client";

import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { createFolder } from "@/lib/knowledge/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateFolderDialog({
  knowledgeBaseId,
  parentId,
}: {
  knowledgeBaseId: string;
  parentId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createFolder(knowledgeBaseId, name, parentId);
      setOpen(false);
      setName("");
      toast.success("Folder created");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create folder");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="me-2 h-4 w-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Folder"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
