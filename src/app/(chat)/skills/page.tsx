"use client";

import {
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
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
import { Textarea } from "ui/textarea";

type Skill = {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  tools: string[] | null;
  visibility: "public" | "private";
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export default function SkillsPage() {
  const t = useTranslations("Skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [toolsInput, setToolsInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skill");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setInstructions("");
    setToolsInput("");
    setVisibility("private");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setName(skill.name);
    setDescription(skill.description ?? "");
    setInstructions(skill.instructions);
    setToolsInput(skill.tools?.join(", ") ?? "");
    setVisibility(skill.visibility);
    setEditingId(skill.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !instructions.trim()) {
      toast.error(t("nameAndInstructionsRequired"));
      return;
    }

    const tools = toolsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      name,
      description: description || null,
      instructions,
      tools: tools.length > 0 ? tools : null,
      visibility,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/skill/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t("updated"));
      } else {
        const res = await fetch("/api/skill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t("created"));
      }
      setDialogOpen(false);
      resetForm();
      fetchSkills();
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/skill/${id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      fetchSkills();
    } catch {
      toast.error(t("deleteFailed"));
    }
  };

  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

      {skills.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? t("noResults") : t("noSkills")}
            </p>
            {!searchQuery && (
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createFirst")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{skill.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        skill.visibility === "public" ? "default" : "secondary"
                      }
                    >
                      {skill.visibility === "public"
                        ? t("public")
                        : t("private")}
                    </Badge>
                  </div>
                </div>
                {skill.description && (
                  <CardDescription className="line-clamp-2">
                    {skill.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="line-clamp-3 font-mono text-xs">
                      {skill.instructions}
                    </p>
                  </div>
                  {skill.tools && skill.tools.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      {skill.tools.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(skill)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(skill.id)}
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
              {editingId ? t("editSkill") : t("createSkill")}
            </DialogTitle>
            <DialogDescription>{t("skillFormDescription")}</DialogDescription>
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
              <Label>{t("instructionsLabel")}</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={t("instructionsPlaceholder")}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("toolsLabel")}</Label>
              <Input
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                placeholder={t("toolsPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("toolsHint")}</p>
            </div>
            <div className="flex items-center gap-4">
              <Label>{t("visibilityLabel")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={visibility === "private" ? "default" : "outline"}
                  onClick={() => setVisibility("private")}
                >
                  {t("private")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={visibility === "public" ? "default" : "outline"}
                  onClick={() => setVisibility("public")}
                >
                  {t("public")}
                </Button>
              </div>
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
    </div>
  );
}
