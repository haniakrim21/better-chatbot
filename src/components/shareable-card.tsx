"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "lib/utils";
import { ShareableActions, type Visibility } from "./shareable-actions";
import { WorkflowSummary } from "app-types/workflow";
import { AgentSummary } from "app-types/agent";
import { MCPServerInfo } from "app-types/mcp";
import { MCPIcon } from "ui/mcp-icon";
import Link from "next/link";
import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// Dynamic Icon Component
const DynamicIcon = ({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const IconName = name as keyof typeof dynamicIconImports;
  const LucideIcon = dynamic(dynamicIconImports[IconName], {
    loading: () => <div className={cn("bg-muted animate-pulse", className)} />,
    ssr: false, // Client-side only to avoid hydration mismatches with icons
  });

  return <LucideIcon className={className} style={style} />;
};

export interface ShareableIcon {
  value?: string;
  style?: {
    backgroundColor?: string;
  };
}
interface ShareableCardProps {
  type: "agent" | "workflow" | "mcp";
  item: AgentSummary | WorkflowSummary | MCPServerInfo;
  isOwner?: boolean;
  href: string;
  onBookmarkToggle?: (itemId: string, isBookmarked: boolean) => void;
  onVisibilityChange?: (itemId: string, visibility: Visibility) => void;
  onDelete?: (itemId: string) => void;
  isVisibilityChangeLoading?: boolean;
  isBookmarkToggleLoading?: boolean;
  isDeleteLoading?: boolean;
  actionsDisabled?: boolean;
  onCollaborationClick?: (itemId: string) => void;
}

export function ShareableCard({
  type,
  item,
  isOwner = true,
  href,
  onBookmarkToggle,
  onVisibilityChange,
  onDelete,
  isBookmarkToggleLoading,
  isVisibilityChangeLoading,
  isDeleteLoading,
  actionsDisabled,
  onCollaborationClick,
}: ShareableCardProps) {
  const t = useTranslations();
  const isPublished = (item as WorkflowSummary).isPublished;
  const isBookmarked =
    type === "mcp" ? undefined : (item as AgentSummary).isBookmarked;

  return (
    <Link href={href} title={item.name}>
      <Card
        className={cn(
          "w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input",
        )}
        data-testid={`${type}-card`}
        data-item-name={item.name}
        data-item-id={item.id}
      >
        <CardHeader className="shrink gap-y-0">
          <CardTitle className="flex gap-3 items-stretch min-w-0">
            <div
              style={{ backgroundColor: item.icon?.style?.backgroundColor }}
              className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0 overflow-hidden"
            >
              {type === "mcp" ? (
                <MCPIcon className="fill-white size-6" />
              ) : (
                (() => {
                  const icon = (item as AgentSummary | WorkflowSummary).icon;
                  if (!icon) {
                    return (
                      <Avatar className="size-6">
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {item.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    );
                  }

                  if (icon.type === "image") {
                    return (
                      <Avatar className="size-6">
                        <AvatarImage src={icon.value} />
                        <AvatarFallback>
                          {item.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    );
                  }

                  if (icon.type === "lucide") {
                    // Convert PascalCase/camelCase/kebab-case to kebab-case for importation
                    // e.g. "BookOpen" -> "book-open"
                    const iconValue = icon.value
                      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                      .toLowerCase();

                    // Check if it's a valid icon name
                    if (iconValue in dynamicIconImports) {
                      return (
                        <DynamicIcon
                          name={iconValue}
                          className="size-6"
                          style={{ color: (icon as any).color }}
                        />
                      );
                    }
                    return <span className="text-xl">?</span>;
                  }

                  if (icon.type === "emoji") {
                    // Check if emoji value is actually a URL (backward compatibility or misuse)
                    const val = icon.value;
                    const isUrl =
                      val.startsWith("http") ||
                      val.startsWith("data:") ||
                      val.startsWith("/");

                    if (isUrl) {
                      return (
                        <Avatar className="size-6">
                          <AvatarImage src={val} />
                          <AvatarFallback>
                            {item.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      );
                    }
                    return <span className="text-xl">{icon.value}</span>;
                  }

                  return (
                    <Avatar className="size-6">
                      <AvatarFallback>
                        {item.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  );
                })()
              )}
            </div>

            <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
              <span
                className="truncate font-medium"
                data-testid={`${type}-card-name`}
              >
                {item.name}
              </span>
              <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                <time className="shrink-0">
                  {format(item.updatedAt || new Date(), "MMM d, yyyy")}
                </time>
                {type === "workflow" && !isPublished && (
                  <span className="px-2 rounded-sm bg-secondary text-foreground shrink-0">
                    {t("Workflow.draft")}
                  </span>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 grow">
          <CardDescription className="text-xs line-clamp-3 wrap-break-word overflow-hidden">
            {item.description}
          </CardDescription>
        </CardContent>

        <CardFooter className="shrink min-h-0 overflow-visible">
          <div className="flex items-center justify-between w-full min-w-0">
            <div onClick={(e) => e.stopPropagation()}>
              <ShareableActions
                type={type}
                visibility={item.visibility}
                isOwner={isOwner}
                isBookmarked={isBookmarked}
                editHref={href}
                onVisibilityChange={
                  onVisibilityChange
                    ? (visibility) => onVisibilityChange(item.id, visibility)
                    : undefined
                }
                onBookmarkToggle={
                  onBookmarkToggle
                    ? (isBookmarked) => onBookmarkToggle(item.id, isBookmarked)
                    : undefined
                }
                onDelete={onDelete ? () => onDelete(item.id) : undefined}
                onCollaborationClick={
                  onCollaborationClick
                    ? () => onCollaborationClick(item.id)
                    : undefined
                }
                isBookmarkToggleLoading={isBookmarkToggleLoading}
                isVisibilityChangeLoading={isVisibilityChangeLoading}
                isDeleteLoading={isDeleteLoading}
                disabled={actionsDisabled}
              />
            </div>

            {!isOwner && item.userName && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="size-4 ring shrink-0 rounded-full">
                  <AvatarImage src={item.userAvatar || undefined} />
                  <AvatarFallback>
                    {item.userName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium truncate min-w-0">
                  {item.userName}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
