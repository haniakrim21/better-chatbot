"use client";

import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Presentation,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";

type ContentBlock = {
  type: "heading" | "paragraph" | "table" | "list" | "code";
  text?: string;
  level?: number;
  items?: string[];
  rows?: string[][];
  language?: string;
};

type DocumentData = {
  format: "pdf" | "xlsx" | "pptx";
  title: string;
  content: ContentBlock[];
  filename: string;
};

const FORMAT_ICONS = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
};

const FORMAT_COLORS = {
  pdf: "text-red-500",
  xlsx: "text-green-500",
  pptx: "text-orange-500",
};

function generatePdfBlob(data: DocumentData): Blob {
  // Simple HTML-to-PDF approach using print-friendly HTML
  const htmlParts: string[] = [
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.title}</title>`,
    `<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;}`,
    `h1{font-size:28px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;}`,
    `h2{font-size:22px;margin-top:24px;}h3{font-size:18px;margin-top:20px;}`,
    `table{border-collapse:collapse;width:100%;margin:16px 0;}`,
    `th,td{border:1px solid #d1d5db;padding:8px 12px;text-align:left;}`,
    `th{background:#f3f4f6;font-weight:600;}`,
    `pre{background:#f3f4f6;padding:16px;border-radius:8px;overflow-x:auto;font-size:14px;}`,
    `ul,ol{padding-left:24px;}li{margin:4px 0;}</style></head><body>`,
    `<h1>${data.title}</h1>`,
  ];

  for (const block of data.content) {
    switch (block.type) {
      case "heading":
        htmlParts.push(
          `<h${block.level || 2}>${block.text || ""}</h${block.level || 2}>`,
        );
        break;
      case "paragraph":
        htmlParts.push(`<p>${block.text || ""}</p>`);
        break;
      case "table":
        if (block.rows?.length) {
          htmlParts.push("<table>");
          block.rows.forEach((row, i) => {
            const tag = i === 0 ? "th" : "td";
            htmlParts.push(
              `<tr>${row.map((cell) => `<${tag}>${cell}</${tag}>`).join("")}</tr>`,
            );
          });
          htmlParts.push("</table>");
        }
        break;
      case "list":
        if (block.items?.length) {
          htmlParts.push("<ul>");
          block.items.forEach((item) => htmlParts.push(`<li>${item}</li>`));
          htmlParts.push("</ul>");
        }
        break;
      case "code":
        htmlParts.push(`<pre><code>${block.text || ""}</code></pre>`);
        break;
    }
  }

  htmlParts.push("</body></html>");
  return new Blob([htmlParts.join("")], { type: "text/html" });
}

function generateXlsxBlob(data: DocumentData): Blob {
  // Generate a simple CSV-like TSV that Excel can open
  const lines: string[] = [data.title, ""];

  for (const block of data.content) {
    switch (block.type) {
      case "heading":
        lines.push("", block.text || "");
        break;
      case "paragraph":
        lines.push(block.text || "");
        break;
      case "table":
        if (block.rows?.length) {
          block.rows.forEach((row) => {
            lines.push(row.join("\t"));
          });
          lines.push("");
        }
        break;
      case "list":
        block.items?.forEach((item) => lines.push(`- ${item}`));
        lines.push("");
        break;
      case "code":
        lines.push(block.text || "");
        break;
    }
  }

  // Use BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new Blob([bom + lines.join("\n")], {
    type: "text/tab-separated-values;charset=utf-8",
  });
}

function generatePptxBlob(data: DocumentData): Blob {
  // Generate a simple HTML presentation
  const slides: string[] = [];

  // Title slide
  slides.push(
    `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;page-break-after:always;">` +
      `<h1 style="font-size:48px;text-align:center;">${data.title}</h1></div>`,
  );

  // Content slides — group content blocks
  let currentSlide = "";
  for (const block of data.content) {
    let html = "";
    switch (block.type) {
      case "heading":
        // Start new slide on headings
        if (currentSlide) {
          slides.push(
            `<div style="padding:40px;page-break-after:always;">${currentSlide}</div>`,
          );
          currentSlide = "";
        }
        html = `<h2 style="font-size:36px;margin-bottom:16px;">${block.text || ""}</h2>`;
        break;
      case "paragraph":
        html = `<p style="font-size:20px;line-height:1.6;">${block.text || ""}</p>`;
        break;
      case "table":
        if (block.rows?.length) {
          html = `<table style="border-collapse:collapse;width:100%;font-size:16px;">`;
          block.rows.forEach((row, i) => {
            const tag = i === 0 ? "th" : "td";
            html += `<tr>${row.map((c) => `<${tag} style="border:1px solid #ccc;padding:8px;">${c}</${tag}>`).join("")}</tr>`;
          });
          html += `</table>`;
        }
        break;
      case "list":
        html = `<ul style="font-size:20px;">${block.items?.map((i) => `<li>${i}</li>`).join("") || ""}</ul>`;
        break;
      case "code":
        html = `<pre style="background:#f3f4f6;padding:16px;border-radius:8px;font-size:14px;">${block.text || ""}</pre>`;
        break;
    }
    currentSlide += html;
  }
  if (currentSlide) {
    slides.push(
      `<div style="padding:40px;page-break-after:always;">${currentSlide}</div>`,
    );
  }

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.title}</title>
    <style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;color:#1a1a1a;}</style></head>
    <body>${slides.join("")}</body></html>`;

  return new Blob([fullHtml], { type: "text/html" });
}

export function DocumentGenerateToolInvocation({
  result,
  state,
}: {
  result?: any;
  state: string;
}) {
  const [downloading, setDownloading] = useState(false);

  if (state !== "result" || !result) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Generating document...
          </span>
        </CardContent>
      </Card>
    );
  }

  let parsed: { status: string; data: DocumentData };
  try {
    parsed = typeof result === "string" ? JSON.parse(result) : result;
  } catch {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-4 text-sm text-destructive">
          Failed to parse document data.
        </CardContent>
      </Card>
    );
  }

  const data = parsed.data;
  if (!data) return null;

  const Icon = FORMAT_ICONS[data.format] || FileText;
  const colorClass = FORMAT_COLORS[data.format] || "text-primary";
  const ext =
    data.format === "xlsx" ? "tsv" : data.format === "pptx" ? "html" : "html";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let blob: Blob;
      switch (data.format) {
        case "xlsx":
          blob = generateXlsxBlob(data);
          break;
        case "pptx":
          blob = generatePptxBlob(data);
          break;
        default:
          blob = generatePdfBlob(data);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.filename || data.title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Document downloaded!");
    } catch {
      toast.error("Failed to generate document");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          {data.title}
          <Badge variant="secondary" className="ml-auto uppercase text-xs">
            {data.format}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">
          {data.content.length} content block
          {data.content.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full"
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download {data.format.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  );
}
