"use client";

import { useEffect, useState } from "react";
import {
  getApiKeys,
  addApiKey,
  removeApiKey,
} from "@/app/actions/api-key-actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { ActionState } from "lib/action-utils";

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google Gemini" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "xai", label: "xAI (Grok)" },
  { value: "groq", label: "Groq" },
  { value: "openRouter", label: "OpenRouter" },
];

type ApiKeyData = {
  id: string;
  provider: string;
  label: string | null;
  key: string;
  createdAt: Date;
};

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    try {
      // validatedAction expects (state, formData)
      const res = (await getApiKeys(null, new FormData())) as ActionState;
      if (res?.success && res.data) {
        setKeys(res.data as ApiKeyData[]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load API keys");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKeyInput) {
      toast.error("Please select a provider and enter an API key");
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append("provider", selectedProvider);
    formData.append("key", apiKeyInput);
    if (labelInput) formData.append("label", labelInput);

    try {
      const res = (await addApiKey(null, formData)) as ActionState;

      if (res?.success) {
        toast.success("API key added successfully");
        setApiKeyInput("");
        setLabelInput("");
        setSelectedProvider("");
        loadKeys();
      } else {
        toast.error(res?.error || "Failed to add API key");
      }
    } catch (_e) {
      toast.error("An error occurred");
    }
    setActionLoading(false);
  };

  const handleRemoveKey = async (id: string) => {
    setActionLoading(true);
    const formData = new FormData();
    formData.append("id", id);

    try {
      const res = (await removeApiKey(null, formData)) as ActionState;
      if (res?.success) {
        toast.success("API key removed");
        loadKeys();
      } else {
        toast.error(res?.error || "Failed to remove API key");
      }
    } catch (_e) {
      toast.error("An error occurred");
    }
    setActionLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Manage your personal API keys for various AI providers. These keys
          remain encrypted and are only used for your requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Key Form */}
        <div className="grid gap-4 md:grid-cols-4 items-end border p-4 rounded-lg bg-muted/30">
          <div className="space-y-2 md:col-span-1">
            <Label>Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Label (Optional)</Label>
            <Input
              placeholder="My Personal Key"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Button
              className="w-full"
              onClick={handleAddKey}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Key
            </Button>
          </div>
        </div>

        {/* Keys List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : keys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No API keys added yet.
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium capitalize">
                      {PROVIDER_OPTIONS.find((p) => p.value === key.provider)
                        ?.label || key.provider}
                    </TableCell>
                    <TableCell>{key.label || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {key.key}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveKey(key.id)}
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
