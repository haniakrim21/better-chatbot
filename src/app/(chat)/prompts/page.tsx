"use client";

import {
  Copy,
  Edit2,
  Loader2,
  PlusIcon,
  SearchIcon,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";

type Prompt = {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type SortOption = "recent" | "alpha" | "variables";

/** Extract `{{variable}}` placeholders from a string */
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

/** Replace `{{variable}}` with values */
function fillVariables(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

export default function PromptsPage() {
  const t = useTranslations("Prompts");
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [usingPrompt, setUsingPrompt] = useState<Prompt | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("prompt-favorites");
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("prompt-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/prompt");
      const data = await res.json();
      setPrompts(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const filtered = useMemo(() => {
    let result = prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
    );

    if (showFavoritesOnly) {
      result = result.filter((p) => favorites.has(p.id));
    }

    // Sort
    if (sortBy === "alpha") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "variables") {
      result = [...result].sort(
        (a, b) =>
          extractVariables(b.content).length -
          extractVariables(a.content).length,
      );
    }
    // "recent" is default order from API

    // Always put favorites first
    result = [
      ...result.filter((p) => favorites.has(p.id)),
      ...result.filter((p) => !favorites.has(p.id)),
    ];

    return result;
  }, [prompts, search, showFavoritesOnly, sortBy, favorites]);

  const openCreate = () => {
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setEditingPrompt(null);
    setCreateOpen(true);
  };

  const openEdit = (prompt: Prompt) => {
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
    setFormTags(prompt.tags?.join(", ") ?? "");
    setEditingPrompt(prompt);
    setCreateOpen(true);
  };

  const openUse = (prompt: Prompt) => {
    setUsingPrompt(prompt);
    const vars = extractVariables(prompt.content);
    const initial: Record<string, string> = {};
    vars.forEach((v) => (initial[v] = ""));
    setVariableValues(initial);
    setUseOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error(t("titleAndContentRequired"));
      return;
    }
    setSaving(true);
    try {
      const tags = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (editingPrompt) {
        await fetch(`/api/prompt/${editingPrompt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            tags,
          }),
        });
        toast.success(t("promptUpdated"));
      } else {
        await fetch("/api/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            tags,
          }),
        });
        toast.success(t("promptCreated"));
      }
      setCreateOpen(false);
      fetchPrompts();
    } catch {
      toast.error(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/prompt/${id}`, { method: "DELETE" });
      toast.success(t("promptDeleted"));
      fetchPrompts();
    } catch {
      toast.error(t("failedToDelete"));
    }
  };

  const handleUse = () => {
    if (!usingPrompt) return;
    const filled = fillVariables(usingPrompt.content, variableValues);
    navigator.clipboard.writeText(filled);
    toast.success(t("copiedToClipboard"));
    setUseOpen(false);
  };

  const handleUseInChat = () => {
    if (!usingPrompt) return;
    const filled = fillVariables(usingPrompt.content, variableValues);
    // Navigate to chat with the filled prompt as query param
    router.push(`/?prompt=${encodeURIComponent(filled)}`);
    setUseOpen(false);
  };

  const variables = usingPrompt ? extractVariables(usingPrompt.content) : [];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="me-2 h-4 w-4" /> {t("createPrompt")}
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={sortBy === "recent" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("recent")}
            className="text-xs h-7"
          >
            Recent
          </Button>
          <Button
            variant={sortBy === "alpha" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("alpha")}
            className="text-xs h-7"
          >
            A-Z
          </Button>
          <Button
            variant={sortBy === "variables" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("variables")}
            className="text-xs h-7"
          >
            Variables
          </Button>
        </div>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="text-xs h-8 gap-1"
        >
          <Star
            className={`h-3 w-3 ${showFavoritesOnly ? "fill-current" : ""}`}
          />
          Favorites
          {favorites.size > 0 && (
            <span className="bg-secondary/80 px-1 rounded text-[10px]">
              {favorites.size}
            </span>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          {search ? t("noResults") : t("noPrompts")}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prompt) => {
            const vars = extractVariables(prompt.content);
            return (
              <Card
                key={prompt.id}
                className="hover:bg-muted/50 transition-colors group"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{prompt.title}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${favorites.has(prompt.id) ? "opacity-100 text-amber-500" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                        onClick={() => toggleFavorite(prompt.id)}
                        title="Favorite"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${favorites.has(prompt.id) ? "fill-current" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openUse(prompt)}
                        title={t("use")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(prompt)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(prompt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {prompt.content}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {vars.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                    {prompt.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? t("editPrompt") : t("createPrompt")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("promptTitle")}</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("promptTitlePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("promptContent")}</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t("promptContentPlaceholder")}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("variableHint")}
              </p>
            </div>
            <div>
              <Label>{t("tags")}</Label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder={t("tagsPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPrompt ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Prompt Dialog (fill variables) */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("usePrompt")}</DialogTitle>
          </DialogHeader>
          {variables.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("fillVariables")}
              </p>
              {variables.map((v) => (
                <div key={v}>
                  <Label className="capitalize">{v}</Label>
                  <Input
                    value={variableValues[v] ?? ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [v]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${v}...`}
                  />
                </div>
              ))}
              <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
                {fillVariables(usingPrompt?.content ?? "", variableValues)}
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
              {usingPrompt?.content}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="outline" onClick={handleUse}>
              <Copy className="mr-2 h-4 w-4" /> {t("copyToClipboard")}
            </Button>
            <Button onClick={handleUseInChat}>{t("useInChat")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
