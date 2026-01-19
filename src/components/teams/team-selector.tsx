"use client";

import {
  Check,
  ChevronsUpDown,
  Users,
  PlusCircle,
  Settings,
  UserPlus,
} from "lucide-react";
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
import { GroupSettingsModal } from "@/components/chat/group-settings-modal";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  value?: string | null;
  onChange: (teamId: string | null) => void;
  onCreateTeam?: () => void;
  className?: string;
  currentUserId: string;
}

export function TeamSelector({
  value,
  onChange,
  onCreateTeam,
  className,
  currentUserId,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const userTeams = await getTeams();
        setTeams(userTeams);

        // If current selected team (value) is not in the list, and it's not null, reset it
        if (value && !userTeams.find((t) => t.id === value)) {
          onChange(null);
        }
      } catch (error) {
        console.error("Failed to fetch teams", error);
      }
    };
    fetchTeams();
  }, [value, onChange]); // Added dependencies

  const selectedTeam = teams.find((team) => team.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {value ? (
              <div className="flex items-center gap-2 truncate">
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedTeam?.name || "Team not found"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 truncate">
                <Users className="h-4 w-4 shrink-0" />
                Personal
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
                    value={team.name}
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
              <CommandSeparator />
              <CommandGroup>
                {value && (
                  <>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setInviteOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setSettingsOpen(true);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Members
                    </CommandItem>
                  </>
                )}
                {onCreateTeam && (
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateTeam();
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Group
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <>
          <GroupSettingsModal
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            teamId={value}
            currentUserId={currentUserId}
          />
          <InviteMemberDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            teamId={value}
            currentUserId={currentUserId}
          />
        </>
      )}
    </>
  );
}
