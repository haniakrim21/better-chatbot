"use client";

import { Button } from "ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadDocument({
  knowledgeBaseId,
  parentId,
}: {
  knowledgeBaseId: string;
  parentId?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledgeBaseId", knowledgeBaseId);
    if (parentId) {
      formData.append("parentId", parentId);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        disabled={uploading}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload className="me-2 h-4 w-4" />
        {uploading ? "Uploading..." : "Upload Document"}
      </Button>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
