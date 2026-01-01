"use client";

import { cn } from "lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function NabdLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  const {} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn("bg-muted rounded-full animate-pulse", className)}
      />
    );
  }

  // "Nabd" means pulse. We'll create a digital heartbeat pulse animation.
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        {/* Pulse Line */}
        <path
          d="M2 12H5L8 3L13 20L17 12H22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-pulse"
        />

        {/* Outer Glow Circle (optional for extra flair) */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="0.5"
          className="opacity-20 animate-pulse"
        />
      </svg>

      {/* Inline styles for the custom draw animation */}
      <style jsx>{`
        .animate-draw-pulse {
          stroke-dasharray: 40; /* Approximate path length */
          stroke-dashoffset: 40;
          animation: draw 2s ease-in-out infinite;
        }

        @keyframes draw {
          0% {
            stroke-dashoffset: 40;
            opacity: 0;
          }
          10% {
             opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          90% {
             opacity: 1;
          }
          100% {
            stroke-dashoffset: -40;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
