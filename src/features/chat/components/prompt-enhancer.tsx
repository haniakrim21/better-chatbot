"use client";

import { optimizePrompt } from "@/app/actions/optimize-prompt";
import { SparklesIcon, CopyIcon, RefreshCwIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Textarea } from "ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { toast } from "sonner";

interface PromptEnhancerProps {
  input: string;
  setInput: (value: string) => void;
  disabled?: boolean;
}

export function PromptEnhancer({
  input,
  setInput,
  disabled,
}: PromptEnhancerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const handleEnhance = async () => {
    if (!input || input.trim().length === 0) {
      toast.error("Please enter a prompt to optimize first.");
      return;
    }

    setIsLoading(true);
    setOptimizedPrompt(""); // Clear previous result
    setIsOpen(true); // Open dialog immediately so user sees loading state inside

    try {
      const result = await optimizePrompt(input);
      setOptimizedPrompt(result);
    } catch (_error) {
      toast.error("Failed to optimize prompt. Please try again.");
      setIsOpen(false); // Close if it failed immediately/catastrophically
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleReplace = () => {
    setInput(optimizedPrompt);
    setIsOpen(false);
    toast.success("Prompt replaced");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnhance}
            disabled={disabled || !input.trim()}
            className="rounded-full p-2 h-8 w-8 hover:bg-violet-100 dark:hover:bg-violet-900/20 text-violet-600 dark:text-violet-400"
          >
            <SparklesIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Optimize Prompt</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-violet-500" />
            Prompt Optimizer
          </DialogTitle>
          <DialogDescription>
            AI-refined version of your prompt for better results.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Original
            </h4>
            <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground italic h-auto max-h-[100px] overflow-y-auto">
              {input}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-foreground">Optimized</h4>
              {optimizedPrompt && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  {hasCopied ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                </Button>
              )}
            </div>

            <div className="relative min-h-[150px]">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-muted/20 rounded-md border border-dashed">
                  <RefreshCwIcon className="size-6 animate-spin text-violet-500" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Enhancing your prompt...
                  </p>
                </div>
              ) : (
                <Textarea
                  value={optimizedPrompt}
                  onChange={(e) => setOptimizedPrompt(e.target.value)}
                  className="min-h-[150px] font-mono text-sm leading-normal resize-none focus-visible:ring-violet-500"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReplace}
            disabled={isLoading || !optimizedPrompt}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Replace Input
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
