"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import useSWR from "swr";
import { fetcher } from "lib/utils";

interface Team {
  id: string;
  name: string;
}

interface TeamSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function TeamSelect({ value, onChange, disabled }: TeamSelectProps) {
  const t = useTranslations();
  const { data: teams, isLoading } = useSWR<Team[]>("/api/teams", fetcher);

  if (!isLoading && (!teams || teams.length === 0)) {
    return null;
  }

  return (
    <Select
      value={value ?? "personal"}
      onValueChange={(val) => onChange(val === "personal" ? null : val)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("Team.selectTeam")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="personal">{t("Team.personal")}</SelectItem>
        {teams?.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
