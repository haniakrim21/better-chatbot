"use client";

import { useEffect, useState } from "react";
import {
  getPlatformApiKeys,
  createPlatformApiKey,
  revokePlatformApiKey,
  revealPlatformApiKey,
} from "@/app/actions/platform-api-key-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Plus,
  Loader2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { ActionState } from "lib/action-utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type PlatformApiKeyData = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[] | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
};

export function PlatformApiKeyManager() {
  const [keys, setKeys] = useState<PlatformApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New key state
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);
  const [isSavedConfirmed, setIsSavedConfirmed] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Reveal state
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = (await getPlatformApiKeys(
        null,
        new FormData(),
      )) as ActionState;
      if (res?.success && res.data) {
        setKeys(res.data as PlatformApiKeyData[]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load platform API keys");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!nameInput) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append("name", nameInput);

    try {
      const res = (await createPlatformApiKey(null, formData)) as ActionState;

      console.log("[Platform API Key] Response:", res);

      if (res?.success && res.data) {
        const apiKey = (res.data as any).key;
        console.log("[Platform API Key] Key created, length:", apiKey?.length);
        setNewKey(apiKey);
        setNameInput("");
        loadKeys();
        toast.success(
          "Platform API key created! Copy it now - it won't be shown again.",
        );
      } else {
        console.error("[Platform API Key] Creation failed:", res?.error);
        toast.error(res?.error || "Failed to create API key");
      }
    } catch (_e) {
      console.error("[Platform API Key] Exception:", _e);
      toast.error("An error occurred");
    }
    setActionLoading(false);
  };

  const handleRevokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append("id", id);

    try {
      const res = (await revokePlatformApiKey(null, formData)) as ActionState;
      if (res?.success) {
        toast.success("API key revoked");
        loadKeys();
      } else {
        toast.error(res?.error || "Failed to revoke API key");
      }
    } catch (_e) {
      toast.error("An error occurred");
    }
    setActionLoading(false);
  };

  const handleRevealKey = async (id: string) => {
    if (revealedKeys[id]) {
      // Toggle off
      const next = { ...revealedKeys };
      delete next[id];
      setRevealedKeys(next);
      return;
    }

    setRevealingId(id);
    const formData = new FormData();
    formData.append("id", id);

    try {
      const res = (await revealPlatformApiKey(null, formData)) as ActionState;
      if (res?.success && res.data) {
        setRevealedKeys((prev) => ({
          ...prev,
          [id]: (res.data as any).key,
        }));
      } else {
        toast.error(res?.error || "Failed to reveal API key");
      }
    } catch {
      toast.error("An error occurred while revealing the key");
    } finally {
      setRevealingId(null);
    }
  };

  const handleCopyKey = async (id: string, key: string) => {
    await copyToClipboard(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setHasBeenCopied(true);
        toast.success("Copied to clipboard");
      } else {
        // Fallback for non-secure contexts or missing clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        textArea.remove();

        if (successful) {
          setCopied(true);
          setHasBeenCopied(true);
          toast.success("Copied to clipboard (fallback)");
        } else {
          throw new Error("Copy command failed");
        }
      }
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy. Please select and copy manually.");
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Platform API Keys
          </div>
          <span className="text-[10px] text-muted-foreground font-normal opacity-50">
            v1.1-reveal
          </span>
        </CardTitle>
        <CardDescription>
          Generate API keys to use Nabd platform functions (Agents, Workflows)
          in other platforms. These keys provide full access to your account
          functions via the API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Key Dialog */}
        <Dialog open={!!newKey} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" hideClose>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                API Key Generated Successfully
              </DialogTitle>
              <DialogDescription className="text-base font-semibold text-orange-600 pt-2">
                ⚠️ IMPORTANT: Copy this key now! It will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div
                onCopy={() => setHasBeenCopied(true)}
                className="flex items-center gap-2 bg-muted p-3 rounded-lg border-2 border-primary/30 font-mono text-sm break-all shadow-inner relative overflow-hidden"
              >
                <code className="flex-1 select-all pr-12">{newKey}</code>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => newKey && copyToClipboard(newKey)}
                  className={`shrink-0 ${!copied && !hasBeenCopied ? "animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" : ""}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Key
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-stretch space-x-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                <Checkbox
                  id="save-confirmation"
                  checked={isSavedConfirmed}
                  className="mt-1"
                  onCheckedChange={(checked) =>
                    setIsSavedConfirmed(checked as boolean)
                  }
                />
                <Label
                  htmlFor="save-confirmation"
                  className="text-sm font-medium leading-relaxed cursor-pointer select-none"
                >
                  I have securely saved this API key. I understand it will never
                  be shown again and cannot be recovered if lost.
                </Label>
              </div>
            </div>

            <DialogFooter className="sm:justify-between items-center gap-4">
              <div className="flex-1">
                {!hasBeenCopied && (
                  <p className="text-xs text-destructive font-medium animate-pulse">
                    Please copy the key first
                  </p>
                )}
                {hasBeenCopied && !isSavedConfirmed && (
                  <p className="text-xs text-orange-600 font-medium">
                    Please confirm you've saved it
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={() => {
                  setNewKey(null);
                  setHasBeenCopied(false);
                  setIsSavedConfirmed(false);
                }}
                disabled={!hasBeenCopied || !isSavedConfirmed}
                className={
                  hasBeenCopied && isSavedConfirmed
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                    : "min-w-[120px]"
                }
              >
                I've saved it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Key Form */}
        {!newKey && (
          <div className="grid gap-4 md:grid-cols-4 items-end border p-4 rounded-lg bg-muted/30">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. My Website Integration"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              />
            </div>
            <div className="md:col-span-1">
              <Button
                className="w-full"
                onClick={handleCreateKey}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Key
              </Button>
            </div>
          </div>
        )}

        {/* Keys List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : keys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No platform API keys created yet.
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {revealedKeys[key.id] ? (
                        <span className="text-primary break-all">
                          {revealedKeys[key.id]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {key.prefix}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {scope}
                          </span>
                        )) || (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {key.expiresAt
                        ? new Date(key.expiresAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {revealedKeys[key.id] ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() =>
                              handleCopyKey(key.id, revealedKeys[key.id])
                            }
                          >
                            {copiedId === key.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => handleRevealKey(key.id)}
                          disabled={revealingId === key.id}
                          title={revealedKeys[key.id] ? "Hide" : "Reveal"}
                        >
                          {revealingId === key.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : revealedKeys[key.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
