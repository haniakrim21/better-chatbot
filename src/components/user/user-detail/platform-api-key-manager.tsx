"use client";

import { useEffect, useState } from "react";
import {
  getPlatformApiKeys,
  createPlatformApiKey,
  revokePlatformApiKey,
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
import { Trash2, Plus, Loader2, Key, Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { ActionState } from "lib/action-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PlatformApiKeyData = {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export function PlatformApiKeyManager() {
  const [keys, setKeys] = useState<PlatformApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New key state
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState("");

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

      if (res?.success && res.data) {
        setNewKey((res.data as any).key);
        setNameInput("");
        loadKeys();
        toast.success("Platform API key created");
      } else {
        toast.error(res?.error || "Failed to create API key");
      }
    } catch (_e) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Platform API Keys
        </CardTitle>
        <CardDescription>
          Generate API keys to use Nabd platform functions (Agents, Workflows)
          in other platforms. These keys provide full access to your account
          functions via the API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Key Alert */}
        {newKey && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle>New API Key Generated</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Please copy this key now. For your security, it will not be
                shown again.
              </p>
              <div className="flex items-center gap-2 bg-background p-2 rounded border font-mono text-sm break-all">
                <span className="flex-1">{newKey}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(newKey)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewKey(null)}
              >
                I've saved it
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {key.prefix}...
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
