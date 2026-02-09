"use client";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Switch } from "ui/switch";
import { Textarea } from "ui/textarea";

type Automation = {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  prompt: string;
  agentId: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunResult: string | null;
  createdAt: string;
  updatedAt: string;
};

function getNextRunLabel(cron: string): string | null {
  try {
    // Parse a simple next-run estimate from common cron patterns
    const parts = cron.split(" ");
    if (parts.length !== 5) return null;
    const [min, hour, dom, , dow] = parts;

    const now = new Date();
    const labels: string[] = [];

    if (hour === "*" && min === "0") {
      labels.push("Every hour");
    } else if (hour.includes("*/")) {
      labels.push(`Every ${hour.replace("*/", "")}h`);
    } else if (dow !== "*") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = days[parseInt(dow)] || dow;
      labels.push(`Next ${dayName} at ${hour}:${min.padStart(2, "0")}`);
    } else if (dom !== "*") {
      labels.push(`Day ${dom} at ${hour}:${min.padStart(2, "0")}`);
    } else if (hour !== "*") {
      const h = parseInt(hour);
      const m = parseInt(min);
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const diff = next.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        labels.push(`in ${hours}h ${mins}m`);
      } else {
        labels.push(`in ${mins}m`);
      }
    }

    return labels[0] || null;
  } catch {
    return null;
  }
}

const SCHEDULE_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at 9am", value: "0 9 * * *" },
  { label: "Weekly (Monday 9am)", value: "0 9 * * 1" },
  { label: "Monthly (1st at 9am)", value: "0 9 1 * *" },
];

export default function AutomationsPage() {
  const t = useTranslations("Automations");
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    name: string;
    result: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("0 9 * * *");
  const [prompt, setPrompt] = useState("");
  const [enabled, setEnabled] = useState(true);

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch("/api/automation");
      if (res.ok) {
        const data = await res.json();
        setAutomations(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSchedule("0 9 * * *");
    setPrompt("");
    setEnabled(true);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (auto: Automation) => {
    setName(auto.name);
    setDescription(auto.description ?? "");
    setSchedule(auto.schedule);
    setPrompt(auto.prompt);
    setEnabled(auto.enabled);
    setEditingId(auto.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !prompt.trim()) {
      toast.error(t("nameAndPromptRequired"));
      return;
    }

    const body = { name, description, schedule, prompt, enabled };

    try {
      if (editingId) {
        const res = await fetch(`/api/automation/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t("updated"));
      } else {
        const res = await fetch("/api/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t("created"));
      }
      setDialogOpen(false);
      resetForm();
      fetchAutomations();
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/automation/${id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      fetchAutomations();
    } catch {
      toast.error(t("deleteFailed"));
    }
  };

  const handleToggle = async (auto: Automation) => {
    try {
      await fetch(`/api/automation/${auto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !auto.enabled }),
      });
      fetchAutomations();
    } catch {
      toast.error(t("toggleFailed"));
    }
  };

  const handleRun = async (auto: Automation) => {
    setRunningId(auto.id);
    try {
      const res = await fetch(`/api/automation/${auto.id}/run`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("runSuccess"));
        setSelectedResult({ name: auto.name, result: data.result });
        setResultDialogOpen(true);
        fetchAutomations();
      } else {
        toast.error(data.error || t("runFailed"));
      }
    } catch {
      toast.error(t("runFailed"));
    } finally {
      setRunningId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const getScheduleLabel = (cron: string) => {
    const preset = SCHEDULE_PRESETS.find((p) => p.value === cron);
    return preset?.label ?? cron;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </div>

      {automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Timer className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noAutomations")}</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((auto) => (
            <Card key={auto.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{auto.name}</CardTitle>
                    <Badge variant={auto.enabled ? "default" : "secondary"}>
                      {auto.enabled ? t("enabled") : t("disabled")}
                    </Badge>
                    {auto.lastRunStatus && (
                      <Badge
                        variant={
                          auto.lastRunStatus === "success"
                            ? "default"
                            : "destructive"
                        }
                        className="gap-1"
                      >
                        {auto.lastRunStatus === "success" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {auto.lastRunStatus === "success"
                          ? t("lastRunSuccess")
                          : t("lastRunError")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={auto.enabled}
                      onCheckedChange={() => handleToggle(auto)}
                    />
                  </div>
                </div>
                {auto.description && (
                  <CardDescription>{auto.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {getScheduleLabel(auto.schedule)}
                    </span>
                    {auto.enabled && getNextRunLabel(auto.schedule) && (
                      <span className="flex items-center gap-1 text-xs text-primary/80">
                        <CalendarClock className="h-3 w-3" />
                        Next: {getNextRunLabel(auto.schedule)}
                      </span>
                    )}
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="line-clamp-2">{auto.prompt}</p>
                  </div>
                  {auto.lastRunAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("lastRun")}: {formatDate(auto.lastRunAt)}
                    </p>
                  )}
                  {auto.lastRunResult && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setSelectedResult({
                          name: auto.name,
                          result: auto.lastRunResult!,
                        });
                        setResultDialogOpen(true);
                      }}
                    >
                      {t("viewLastResult")}
                    </Button>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRun(auto)}
                      disabled={runningId === auto.id}
                    >
                      {runningId === auto.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {t("runNow")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(auto)}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(auto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("editAutomation") : t("createAutomation")}
            </DialogTitle>
            <DialogDescription>
              {t("automationFormDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("nameLabel")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("descriptionLabel")}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("scheduleLabel")}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SCHEDULE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={schedule === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSchedule(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="0 9 * * *"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("promptLabel")}</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder")}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>{t("enabledLabel")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave}>
              {editingId ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedResult?.name} - {t("result")}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
            {selectedResult?.result}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResultDialogOpen(false)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
