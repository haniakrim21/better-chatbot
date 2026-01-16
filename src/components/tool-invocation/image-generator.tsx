"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { cn } from "lib/utils";
import { Download, ExternalLink, ImagesIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";
import LetterGlitch from "ui/letter-glitch";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";

interface ImageGeneratorToolInvocationProps {
  part: ToolUIPart;
}

interface ImageGenerationResult {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  model: string;
}

function PureImageGeneratorToolInvocation({
  part,
}: ImageGeneratorToolInvocationProps) {
  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ImageGenerationResult;
  }, [part.state, part.output]);

  const images = useMemo(() => {
    return result?.images || [];
  }, [result]);

  const mode = useMemo(() => {
    return result?.mode || "create";
  }, [result]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && result?.images.length === 0)
    );
  }, [part.state, result]);

  // Get mode-specific text
  const getModeText = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Editing image...";
      case "composite":
        return "Compositing images...";
      default:
        return "Generating image...";
    }
  };

  const getModeHeader = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Image edited";
      case "composite":
        return "Images composited";
      default:
        return "Image generated";
    }
  };

  const handleDownload = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to simple link
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Simple loading state like web-search
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4">
        <TextShimmer>{getModeText(mode)}</TextShimmer>
        <div className="w-full h-96 overflow-hidden rounded-lg">
          <LetterGlitch />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Image generation may take up to 1 minute.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!hasError && <ImagesIcon className="size-4" />}
        <span className="text-sm font-semibold">
          {hasError ? "Image generation failed" : getModeHeader(mode)}
        </span>
        <span className="text-xs text-muted-foreground">{result?.model}</span>
      </div>

      <div className="w-full flex flex-col gap-3 pb-2">
        {hasError ? (
          <div className="bg-card text-muted-foreground p-6 rounded-lg text-xs border border-border/20">
            {part.errorText ??
              (result?.images.length === 0
                ? "No images generated"
                : "Failed to generate image. Please try again.")}
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid gap-3",
                images.length === 1
                  ? "grid-cols-1 max-w-2xl"
                  : "grid-cols-1 md:grid-cols-2 max-w-3xl",
              )}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-border hover:border-primary transition-all shadow-sm hover:shadow-md"
                >
                  <Dialog>
                    <DialogTrigger className="w-full h-auto p-0 border-none bg-transparent cursor-zoom-in relative block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        loading="lazy"
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                    </DialogTrigger>

                    <DialogContent
                      className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none"
                      hideClose
                    >
                      <div className="relative group/lightbox">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={`Generated image ${index + 1} full size`}
                          className="max-w-[90vw] max-h-[85vh] w-auto h-auto rounded-md shadow-2xl object-contain"
                        />

                        {/* Lightbox Toolbar */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover/lightbox:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                            asChild
                            title="Open in new tab"
                          >
                            <a
                              href={image.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-5" />
                            </a>
                          </Button>

                          <div className="w-px h-4 bg-white/20 mx-1" />

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                            title="Download PNG"
                            onClick={(e) => handleDownload(e, image.url)}
                          >
                            <Download className="size-5" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>

                    {/* Hover overlay for thumbnail */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-none">
                      {/* Use pointer-events-auto on buttons to ensure they work inside pointer-events-none parent */}
                      <div className="pointer-events-auto flex gap-2">
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full shadow-sm bg-background/80 hover:bg-background"
                            title="Maximize"
                          >
                            <ImagesIcon className="size-4" />
                          </Button>
                        </DialogTrigger>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-full shadow-sm bg-background/80 hover:bg-background"
                          asChild
                          title="Open in new tab"
                        >
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-full shadow-sm bg-background/80 hover:bg-background"
                          title="Download image"
                          onClick={(e) => handleDownload(e, image.url)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Dialog>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const ImageGeneratorToolInvocation = memo(
  PureImageGeneratorToolInvocation,
  (prev, next) => {
    return equal(prev.part, next.part);
  },
);
