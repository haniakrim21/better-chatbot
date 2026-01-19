"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { createTeam } from "lib/teams/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { appStore } from "@/app/store";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({
  open,
  onOpenChange,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const team = await createTeam({ name });
      toast.success("Group chat created");
      onOpenChange(false);
      setName("");

      // Auto-select the new team
      appStore.getState().mutate({ currentTeamId: team.id });

      router.refresh(); // Refresh to show new group in list
    } catch (_error) {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Group Chat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Project Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
