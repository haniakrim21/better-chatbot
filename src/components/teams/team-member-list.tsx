"use client";

import { useState } from "react";
import { Button } from "ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { InviteMemberDialog } from "./invite-member-dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import {
  PlusIcon,
  Trash2Icon,
  ShieldIcon,
  UserIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { removeMember, updateMemberRole } from "lib/teams/actions";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamMemberListProps {
  teamId: string;
  members: TeamMember[];
  currentUserRole: string; // "owner" | "admin" | "member"
  currentUserId: string;
}

export function TeamMemberList({
  teamId,
  members,
  currentUserRole,
  currentUserId,
}: TeamMemberListProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const router = useRouter();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const handleRemove = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember(teamId, memberToRemove);
      toast.success("Member removed successfully");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to remove member");
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "member",
  ) => {
    setUpdatingRoleId(userId);
    try {
      await updateMemberRole(teamId, userId, newRole);
      toast.success("Role updated successfully");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Members</h3>

        {canManage && (
          <InviteMemberDialog
            teamId={teamId}
            currentUserId={currentUserId}
            open={isInviteOpen}
            onOpenChange={setIsInviteOpen}
          >
            <Button size="sm">
              <PlusIcon className="me-2 h-4 w-4" /> Add Member
            </Button>
          </InviteMemberDialog>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {member.user.name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {/* Role Display / Editor */}
                  {canManage &&
                  member.role !== "owner" &&
                  member.user.id !== currentUserId &&
                  (currentUserRole === "owner" ||
                    (currentUserRole === "admin" &&
                      member.role === "member")) ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(val: "admin" | "member") =>
                          handleRoleChange(member.user.id, val)
                        }
                        disabled={updatingRoleId === member.user.id}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingRoleId === member.user.id && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                          ${
                            member.role === "owner"
                              ? "bg-primary/10 text-primary"
                              : member.role === "admin"
                                ? "bg-orange-500/10 text-orange-600"
                                : "bg-secondary text-secondary-foreground"
                          }`}
                    >
                      {member.role === "owner" && (
                        <ShieldIcon className="w-3 h-3 me-1" />
                      )}
                      {member.role}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </TableCell>
                {canManage && (
                  <TableCell>
                    {member.role !== "owner" &&
                      member.user.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                          onClick={() => setMemberToRemove(member.user.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will be removed from the team and will lose access to
              all team resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
