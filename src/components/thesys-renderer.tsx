"use client";

import { C1Component } from "@thesysai/genui-sdk";
import React, { useMemo } from "react";
import { decodeHtmlEntities } from "lib/utils";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export function ThesysRenderer({
  content,
  isStreaming = false,
  onAction,
}: {
  content: string;
  isStreaming?: boolean;
  onAction?: (action: any) => void;
}) {
  // Decode HTML entities (e.g. &quot;) to ensure valid structure for the SDK
  // AND strip the wrapper tags so we pass pure JSON to the SDK.
  const sanitizedContent = useMemo(() => {
    let decoded = decodeHtmlEntities(content);

    // 1. Remove the specific start tag if present at the start
    decoded = decoded.replace(/^\s*<content\s+thesys="true">/i, "");

    // 2. Remove closing tag (full or partial) at the end to support streaming
    // Matches </, </c, </co, ... </content, </content> at the end of string
    decoded = decoded.replace(
      /<\/(?:c(?:o(?:n(?:t(?:e(?:n(?:t(?:>)?)?)?)?)?)?)?)?$/i,
      "",
    );

    // 3. Remove Markdown code blocks
    // Remove starting ```json or ```
    decoded = decoded.replace(/^\s*```(?:json)?\s*/i, "");

    // Remove trailing ``` or partials (` or ``)
    decoded = decoded.replace(/\s*`{1,3}$/, "");

    return decoded.trim();
  }, [content]);

  // Ref for the content container to capture
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleExportPdf = async ({
    exportParams,
    title,
  }: {
    exportParams?: any;
    title?: string;
  }) => {
    try {
      const element = contentRef.current;
      if (!element) return;

      // Use html-to-image with style overrides to capture full scroll height
      const imgData = await toPng(element, {
        cacheBust: true,
        // Force the clone to be full height/width to capture scrollable content
        style: {
          height: "auto",
          maxHeight: "none",
          overflow: "visible",
        },
        // Ensure the background is white (transparent by default might look odd in PDF)
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // If height is greater than page, we might need multiple pages.
      // For now, simpler single page scaling or multi-page support.
      // Let's implement basic multi-page splitting if it's very long, or just fit width.
      // For "Analysis Report", usually fitting to width is primary.

      // Simple logic: If it fits on one page, just add it.
      // If not, we might need to slice it. But jsPDF addImage doesn't slice easily.
      // Let's stick to simple "add image", user can zoom.
      // Or better: Change PDF height if it's a long report (custom format).
      // Standard A4 is fixed. Let's try to fit or allow expansion.
      // Actually, for reports, standard logic is adding pages.
      // Complex logic excluded for brevity unless requested. Sticking to single long image resizing usually makes it tiny.
      // Let's create a custom page size matching the content height if it exceeds A4,
      // effectively creating a "long scroll" PDF which is often better for digital reading.

      // Checking if height exceeds A4 (approx 842pt)
      if (pdfHeight > 842) {
        // Create a new PDF with custom dimensions matching the content
        const longPdf = new jsPDF({
          orientation: "p",
          unit: "pt",
          format: [pdfWidth, pdfHeight + 40], // + margins
        });
        longPdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        longPdf.save(`${title || "report"}.pdf`);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${title || "report"}.pdf`);
      }
    } catch (error) {
      console.error("PDF Export failed", error);
    }
  };

  // Debug state
  const [showDebug, setShowDebug] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Performance Optimization:
    // Skip validating JSON during streaming. It's computationally expensive to parse
    // the full string on every token update, and partial JSON is expected/handled by the SDK.
    if (isStreaming) {
      if (parseError) setParseError(null);
      return;
    }

    try {
      if (sanitizedContent) {
        JSON.parse(sanitizedContent);
        setParseError(null);
      }
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, [sanitizedContent, isStreaming, parseError]);

  return (
    <div className="thesys-ui-container w-full my-4 border rounded-lg bg-background overflow-hidden relative group">
      <div className="flex justify-between items-center p-2 bg-muted/20 border-b">
        <span className="text-xs text-muted-foreground font-medium pl-2">
          Interactive Component
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            {showDebug ? "Hide Debug" : "Debug"}
          </button>
          <button
            onClick={() => handleExportPdf({ title: "analysis-report" })}
            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded transition-colors flex items-center gap-1"
          >
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="p-4 bg-muted border-b overflow-auto max-h-60 text-xs font-mono">
          <p className="font-bold mb-2">Raw Content:</p>
          <pre className="whitespace-pre-wrap">{content}</pre>
          <p className="font-bold my-2">Sanitized Content:</p>
          <pre className="whitespace-pre-wrap">{sanitizedContent}</pre>
          {parseError && (
            <p className="text-red-500 font-bold mt-2">
              JSON Parse Error: {parseError}
            </p>
          )}
        </div>
      )}

      <div className="p-4" ref={contentRef}>
        {parseError ? (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            <h4 className="font-bold">Failed to load component logic</h4>
            <p className="text-sm mt-1">The AI response was not valid JSON.</p>
          </div>
        ) : (
          <C1Component
            c1Response={sanitizedContent}
            isStreaming={isStreaming}
            exportAsPdf={handleExportPdf}
            onAction={(action) => {
              console.log("Thesys Action:", action);
              onAction?.(action);
            }}
          />
        )}
      </div>
    </div>
  );
}
