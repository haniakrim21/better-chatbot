"use client";

import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Upload, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function KnowledgeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledgeBaseId", id);

    try {
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      // Refresh
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Knowledge Base: {id}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center p-2 rounded-md border bg-card">
              <FileText className="h-4 w-4 mr-2" />
              <span className="flex-1">example.pdf</span>
              <span className="text-xs text-muted-foreground mr-2">
                Processed
              </span>
            </div>
            {/* List real docs here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
