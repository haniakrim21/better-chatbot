"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "ui/dialog";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { getTeamMembers, deleteTeam } from "lib/teams/actions";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface GroupSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  currentUserId: string;
}

export function GroupSettingsModal({
  open,
  onOpenChange,
  teamId,
  currentUserId,
}: GroupSettingsModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState("member");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && teamId && currentUserId) {
      loadMembers();
    }
  }, [open, teamId, currentUserId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers(teamId, currentUserId);
      setMembers(data);

      const myMembership = data.find((m: any) => m.user.id === currentUserId);
      if (myMembership) {
        setCurrentUserRole(myMembership.role);
      }
    } catch (error) {
      console.error("Failed to load members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteTeam(teamId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team deleted successfully");
      setDeleteDialogOpen(false);
      onOpenChange(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete team", error);
      toast.error("Failed to delete team");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Manage members and settings for this group.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4">
            <TeamMemberList
              teamId={teamId}
              members={members}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {currentUserRole === "owner" && !loading && members.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-destructive mb-2">
              Danger Zone
            </h4>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete this team</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove this team and all its data.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be
              undone. All members will be removed and all chat history will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTeam();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
