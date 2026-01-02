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
import { Textarea } from "ui/textarea";
import { FilePlus } from "lucide-react";
import { useState } from "react";
import { createFile } from "@/lib/knowledge/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateFileDialog({
  knowledgeBaseId,
  parentId,
}: {
  knowledgeBaseId: string;
  parentId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createFile(knowledgeBaseId, name, content, parentId);
      setOpen(false);
      setName("");
      setContent("");
      toast.success("File created");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create file");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePlus className="me-2 h-4 w-4" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Create a text file directly in your knowledge base.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="document.txt"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter file content here..."
                disabled={loading}
                className="min-h-[300px] font-mono"
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
              {loading ? "Creating..." : "Create File"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
