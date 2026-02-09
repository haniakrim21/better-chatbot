"use client";

import { PersonalityPreset } from "app-types/chat";
import { cn } from "lib/utils";
import {
  BookOpen,
  BrainCircuit,
  Check,
  Code2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useShallow } from "zustand/shallow";
import { appStore } from "@/app/store";

const PRESETS: {
  value: PersonalityPreset;
  icon: typeof Zap;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: "default",
    icon: BrainCircuit,
    labelKey: "default",
    descKey: "defaultDescription",
  },
  {
    value: "concise",
    icon: Zap,
    labelKey: "concise",
    descKey: "conciseDescription",
  },
  {
    value: "detailed",
    icon: BookOpen,
    labelKey: "detailed",
    descKey: "detailedDescription",
  },
  {
    value: "creative",
    icon: Sparkles,
    labelKey: "creative",
    descKey: "creativeDescription",
  },
  {
    value: "technical",
    icon: Code2,
    labelKey: "technical",
    descKey: "technicalDescription",
  },
];

export const PersonalityPresetSelector = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const t = useTranslations("Chat.Personality");
  const [personalityPreset, appStoreMutate] = appStore(
    useShallow((state) => [state.personalityPreset, state.mutate]),
  );
  const [open, setOpen] = useState(false);

  const current =
    PRESETS.find((p) => p.value === personalityPreset) ?? PRESETS[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full p-2! data-[state=open]:bg-input! hover:bg-input!",
                  personalityPreset !== "default" && "text-primary",
                  open && "bg-input!",
                )}
                onClick={() => setOpen(true)}
              >
                <CurrentIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t("title")}
              {personalityPreset !== "default" && (
                <span className="ml-1 text-primary">
                  ({t(current.labelKey)})
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground">
          {t("title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {PRESETS.map((preset, index) => {
            const Icon = preset.icon;
            return (
              <div key={preset.value}>
                {index > 0 && (
                  <div className="px-2 py-0.5">
                    <DropdownMenuSeparator />
                  </div>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    appStoreMutate({
                      personalityPreset: preset.value,
                    })
                  }
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <span className="font-bold">{t(preset.labelKey)}</span>
                      {personalityPreset === preset.value && (
                        <Check className="ms-auto size-4" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(preset.descKey)}
                    </p>
                  </div>
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
