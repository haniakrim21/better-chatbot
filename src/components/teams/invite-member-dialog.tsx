"use client";

import { useState } from "react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { toast } from "sonner";
import { inviteMember } from "lib/teams/actions";
import { useRouter } from "next/navigation";

interface InviteMemberDialogProps {
  teamId: string;
  currentUserId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function InviteMemberDialog({
  teamId,
  currentUserId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
}: InviteMemberDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsLoading(true);
    try {
      const result = await inviteMember(
        currentUserId,
        teamId,
        inviteEmail,
        inviteRole,
      );
      if (result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Member added successfully");
      setOpen(false);
      setInviteEmail("");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add member");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to add to this team.
            They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              placeholder="user@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={inviteRole}
              onValueChange={(val: "admin" | "member") => setInviteRole(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
