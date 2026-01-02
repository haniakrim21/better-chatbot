"use client";

import { Check, ChevronsUpDown, Users } from "lucide-react";
import { cn } from "lib/utils";
import { Button } from "ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { getTeams } from "lib/teams/actions";
import { useEffect, useState } from "react";
// If useUser doesn't exist or is problematic, I will fetch user via session action or assume passed prop.
// 'getTeams' needs userId.
// I will update 'getTeams' to use 'getSession' internally like 'createTeam'.

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  value?: string | null;
  onChange: (teamId: string | null) => void;
  className?: string;
}

export function TeamSelector({
  value,
  onChange,
  className,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // getTeams should be updated to not require userId if I call it from here without arg,
        // OR I pass userId prop to TeamSelector.
        // I will update getTeams to use session.
        const userTeams = await getTeams();
        setTeams(userTeams);
      } catch (error) {
        console.error("Failed to fetch teams", error);
      }
    };
    fetchTeams();
  }, []);

  const selectedTeam = teams.find((team) => team.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {selectedTeam?.name || "Team not found"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personal (No Team)
            </div>
          )}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup heading="Personal">
              <CommandItem
                value="personal"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "me-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                Personal
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Teams">
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name} // CommandItem uses value for search?
                  onSelect={() => {
                    onChange(team.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      value === team.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {team.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
