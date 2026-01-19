"use client";

import { useState } from "react";
import { deleteTeam } from "lib/teams/actions";
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

interface TeamDangerZoneProps {
  teamId: string;
}

export function TeamDangerZone({ teamId }: TeamDangerZoneProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
    <>
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete this team</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove this team and all its data.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        </div>
      </div>

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
    </>
  );
}
