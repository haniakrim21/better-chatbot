"use client";

import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { MicIcon, StopCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";

interface VoiceToTextButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceToTextButton({
  onTranscript,
  disabled,
}: VoiceToTextButtonProps) {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechToText({ continuous: true });

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className={cn(
            "rounded-full p-2 h-8 w-8 transition-all duration-200",
            isListening
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse"
              : "hover:bg-muted text-muted-foreground",
          )}
        >
          {isListening ? (
            <StopCircle className="size-4" />
          ) : (
            <MicIcon className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isListening ? "Stop dictation" : "Dictate text"}
      </TooltipContent>
    </Tooltip>
  );
}
