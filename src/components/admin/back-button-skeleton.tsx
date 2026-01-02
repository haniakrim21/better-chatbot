import { Button } from "ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButtonSkeleton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="hover:bg-muted opacity-50 cursor-not-allowed"
      disabled
    >
      <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
      Back to Users
    </Button>
  );
}
