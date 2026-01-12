"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { generateGenericImageAction } from "@/app/api/user/actions";
import { Loader2, Download, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { HuggingFaceIcon } from "@/components/ui/hugging-face-icon";

export default function ImageGeneratorPage() {
  const searchParams = useSearchParams();
  const modelId =
    searchParams.get("model") || "black-forest-labs/FLUX.1-schnell";
  const provider = (searchParams.get("provider") as any) || "huggingface";

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const result = await generateGenericImageAction(
        provider,
        prompt,
        modelId,
      );
      if (result.success && result.base64) {
        setGeneratedImage(`data:${result.mimeType};base64,${result.base64}`);
        toast.success("Image generated!");
      } else {
        toast.error(result.error || "Failed to generate image");
      }
    } catch (_error) {
      toast.error("An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 gap-8">
      <div className="space-y-2 text-center mt-10">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold">
          {provider === "huggingface" ? (
            <HuggingFaceIcon className="w-8 h-8 text-[#FFD21E]" />
          ) : (
            <ImageIcon className="w-8 h-8" />
          )}
          Image Generator
        </div>
        <p className="text-muted-foreground">
          Using model:{" "}
          <span className="font-mono bg-muted px-1 py-0.5 rounded">
            {modelId}
          </span>
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-xl bg-muted/30 relative overflow-hidden">
        {generatedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/5">
            <img
              src={generatedImage}
              alt="Generated"
              className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 shadow-lg"
              onClick={() => {
                const link = document.createElement("a");
                link.href = generatedImage;
                link.download = `generated-${Date.now()}.png`;
                link.click();
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p>Generating artwork...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-12 h-12 opacity-50" />
                <p>Enter a prompt to generate an image</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          disabled={isGenerating}
          className="flex-1"
        />
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt}>
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </div>
  );
}
