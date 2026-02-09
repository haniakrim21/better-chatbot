"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { Download, ExternalLink, VideoIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";
import LetterGlitch from "ui/letter-glitch";
import { Button } from "ui/button";

interface VideoGeneratorToolInvocationProps {
  part: ToolUIPart;
}

interface VideoGenerationResult {
  videos: {
    url: string;
    mimeType?: string;
  }[];
  model: string;
}

function PureVideoGeneratorToolInvocation({
  part,
}: VideoGeneratorToolInvocationProps) {
  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as VideoGenerationResult;
  }, [part.state, part.output]);

  const videos = useMemo(() => {
    return result?.videos || [];
  }, [result]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && result?.videos.length === 0)
    );
  }, [part.state, result]);

  const handleDownload = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4">
        <TextShimmer>Generating video...</TextShimmer>
        <div className="w-full h-96 overflow-hidden rounded-lg">
          <LetterGlitch />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Video generation may take up to 2 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!hasError && <VideoIcon className="size-4" />}
        <span className="text-sm font-semibold">
          {hasError ? "Video generation failed" : "Video generated"}
        </span>
        <span className="text-xs text-muted-foreground">{result?.model}</span>
      </div>

      <div className="w-full flex flex-col gap-3 pb-2">
        {hasError ? (
          <div className="bg-card text-muted-foreground p-6 rounded-lg text-xs border border-border/20">
            {part.errorText ??
              (result?.videos.length === 0
                ? "No videos generated"
                : "Failed to generate video. Please try again.")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 max-w-2xl gap-3">
              {videos.map((video, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-border hover:border-primary transition-all shadow-sm hover:shadow-md bg-black"
                >
                  <video
                    src={video.url}
                    controls
                    className="w-full h-auto aspect-video rounded-lg"
                    poster=""
                  />

                  {/* Toolbar */}
                  <div className="absolute top-2 right-2 flex items-center gap-2 p-1 bg-black/50 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      asChild
                      title="Open in new tab"
                    >
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      title="Download MP4"
                      onClick={(e) => handleDownload(e, video.url)}
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const VideoGeneratorToolInvocation = memo(
  PureVideoGeneratorToolInvocation,
  (prev, next) => {
    return equal(prev.part, next.part);
  },
);
