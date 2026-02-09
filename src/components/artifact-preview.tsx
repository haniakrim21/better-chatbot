"use client";

import { Code2, ExternalLink, Eye, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "ui/button";
import { cn } from "@/lib/utils";

interface ArtifactPreviewProps {
  code: string;
  language?: string;
  title?: string;
}

/**
 * Renders HTML/JS/CSS code in a sandboxed iframe for live preview.
 * Supports HTML documents, React-style JSX (wrapped in HTML), and CSS.
 */
export function ArtifactPreview({
  code,
  language,
  title,
}: ArtifactPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isPreviewable =
    language === "html" ||
    language === "htm" ||
    language === "svg" ||
    code.trim().startsWith("<!DOCTYPE") ||
    code.trim().startsWith("<html") ||
    code.trim().startsWith("<svg") ||
    (code.includes("<") && code.includes("</") && !language);

  const getPreviewHtml = useCallback(() => {
    // If it's already a full HTML document, use as-is
    if (
      code.trim().startsWith("<!DOCTYPE") ||
      code.trim().startsWith("<html")
    ) {
      return code;
    }

    // Wrap partial HTML in a basic document
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 16px; color: #1a1a1a; }
  </style>
</head>
<body>
${code}
</body>
</html>`;
  }, [code]);

  const handleOpenInNewTab = () => {
    const html = getPreviewHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!isPreviewable) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs"
        >
          {showPreview ? (
            <>
              <Code2 className="mr-1 h-3 w-3" /> Hide Preview
            </>
          ) : (
            <>
              <Eye className="mr-1 h-3 w-3" /> Live Preview
            </>
          )}
        </Button>
        {showPreview && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {showPreview && (
        <div
          className={cn(
            "mt-2 rounded-lg border overflow-hidden bg-white transition-all",
            isExpanded ? "h-[500px]" : "h-64",
          )}
        >
          <iframe
            ref={iframeRef}
            srcDoc={getPreviewHtml()}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title={title || "Artifact Preview"}
          />
        </div>
      )}
    </div>
  );
}
