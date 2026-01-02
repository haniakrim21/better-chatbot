import Link from "next/link";
import { Button } from "ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background gap-4 text-center p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full bg-muted p-4">
          <Ghost className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="text-xl font-medium text-muted-foreground">
          Page Not Found
        </p>
      </div>
      <p className="max-w-[400px] text-muted-foreground text-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="default" className="gap-2">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
