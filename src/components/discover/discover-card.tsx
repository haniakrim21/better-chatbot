"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { ArrowUpRight, User, Download, MessageSquare } from "lucide-react";
import { cn } from "lib/utils";

interface DiscoverCardProps {
  id: string;
  type: "agent" | "mcp";
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  author?: {
    name: string;
    avatar?: string;
  };
  tags?: string[];
  usageCount: number;
  onAction?: () => Promise<void> | void;
  className?: string;
  customActionLink?: string;
  customActionLabel?: string;
}

export function DiscoverCard({
  id,
  type,
  title,
  description,
  icon,
  author,
  tags = [],
  usageCount,
  onAction,
  className,
  customActionLink,
  customActionLabel,
}: DiscoverCardProps) {
  const router = useRouter();
  const actionLabel =
    customActionLabel || (type === "agent" ? "Use" : "Install");
  const ActionIcon = type === "agent" ? MessageSquare : Download;

  const [isLoading, setIsLoading] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  // Reset error state when icon changes
  React.useEffect(() => {
    setImgError(false);
  }, [icon]);

  const handleAction = async (e: React.MouseEvent) => {
    // Determine target link
    const targetLink =
      customActionLink || (type === "agent" ? `/?agentId=${id}` : null);

    // If we have an action (like install or increment usage)
    if (onAction) {
      e.preventDefault(); // Stop default link navigation
      e.stopPropagation();

      setIsLoading(true);
      try {
        await onAction();

        if (type === "mcp") {
          toast.success("Plugin installed successfully");
        }

        // If there's a link, navigate after action
        if (targetLink) {
          router.push(targetLink);
        }
      } catch (error) {
        console.error("Action failed:", error);
        toast.error("Action failed");
      } finally {
        setIsLoading(false);
      }
    }
    // If no action but we have a link, standard Link behavior handles it (if we didn't use this handler)
    // But since we are attaching this to onClick, if onAction is undefined, we let the event bubble
    // to the Link (if we used Link). However, we are going to use Button onClick for everything to be safe.
    else if (targetLink) {
      e.preventDefault();
      router.push(targetLink);
    }
  };

  const renderContent = () => (
    <>
      <span>
        {isLoading
          ? type === "mcp" && !customActionLink
            ? "Downloading..."
            : "Loading..."
          : actionLabel}
      </span>
      {type === "mcp" && !customActionLink ? (
        <Download
          className={cn(
            "size-3.5 group-hover/btn:scale-110 transition-transform",
            isLoading && "animate-pulse",
          )}
        />
      ) : (
        <ArrowUpRight className="size-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
      )}
    </>
  );

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const renderIcon = () => {
    if (!icon || imgError) {
      // If title is available, show initials
      if (title) {
        return (
          <div className="text-sm font-bold text-primary/80">
            {getInitials(title)}
          </div>
        );
      }
      return (
        <div className="size-full bg-linear-to-br from-primary/20 to-primary/5" />
      );
    }

    if (React.isValidElement(icon)) return icon;

    const renderImage = (src: string) => (
      <img
        src={src}
        alt={title}
        className="size-full object-cover"
        onError={() => setImgError(true)}
      />
    );

    if (typeof icon === "string") {
      // Strict URL Check: Must be http/https or data:uri
      // OR if it has a dot and slash (relative path or weird url) but NOT just a name like "Agent Name"
      // We assume "Agent Name" won't have a slash.
      const isUrl =
        icon.startsWith("http") ||
        icon.startsWith("data:") ||
        icon.startsWith("/");

      if (isUrl) {
        return renderImage(icon);
      }

      // If strict url failed, check for loose url (e.g. "foo.com/bar") but exclude spaces
      const isLooseUrl =
        (icon.includes("/") || icon.includes(".")) && !icon.includes(" ");
      if (isLooseUrl) {
        return renderImage(`https://${icon}`);
      }

      // Otherwise treat as emoji or valid text (if short) or initials
      if (icon.length <= 4) return <span className="text-xl">{icon}</span>;

      // Fallback to initials if it's a long string
      return (
        <div className="text-sm font-bold text-primary/80">
          {getInitials(icon)}
        </div>
      );
    }

    if (typeof icon === "object" && "type" in icon && "value" in icon) {
      const typedIcon = icon as { type: string; value: string };
      if (typedIcon.type === "emoji") {
        // Check if value is actually a URL
        const val = typedIcon.value;
        const isUrl =
          val.startsWith("http") ||
          val.startsWith("data:") ||
          val.startsWith("/");

        if (isUrl) return renderImage(val);

        const isLooseUrl =
          (val.includes("/") || val.includes(".")) && !val.includes(" ");
        if (isLooseUrl) return renderImage(`https://${val}`);

        return <span className="text-xl">{typedIcon.value}</span>;
      }
      if (typedIcon.type === "image") {
        return renderImage(typedIcon.value);
      }
    }

    return null;
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-[400px] overflow-hidden border-border/50 bg-card/50 backdrop-blur-[2px] hover:bg-card hover:border-border/80 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardHeader className="p-5 flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            {renderIcon()}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {author && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                <Avatar className="size-3.5">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback className="text-[8px]">
                    <User className="size-2" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[120px]">{author.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 flex-col flex gap-4 grow">
        <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {description || "No description provided."}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 bg-secondary/50 font-normal text-muted-foreground"
            >
              #{tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground flex items-center h-5 px-1">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border/10 bg-muted/20 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <ActionIcon className="size-3.5 opacity-70" />
          <span>
            {Intl.NumberFormat("en-US", {
              notation: "compact",
              compactDisplay: "short",
            }).format(usageCount)}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={isLoading && !customActionLink}
          className="h-8 gap-1 shadow-sm hover:shadow-md transition-all group/btn cursor-pointer bg-background hover:bg-background/80 border border-border/50"
          onClick={handleAction}
        >
          {renderContent()}
        </Button>
      </CardFooter>
    </Card>
  );
}
