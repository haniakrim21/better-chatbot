"use client";

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider } from "@thesysai/genui-sdk";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
// Import ThemeMode type if possible, or cast to any if generic string is accepted.
// The SDK likely accepts "light" | "dark" | "system".

export function ThesysProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  // Ensure we wait for mount to avoid hydration mismatch, though next-themes handles this usually.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return children wrapped in a default provider or null to avoid flicker?
    // Better to render with default (system) or just children.
    // However, the SDK might need the provider context to function at all.
    return <ThemeProvider mode="system">{children}</ThemeProvider>;
  }

  // Cast resolvedTheme to be compatible with SDK's expected mode string
  return (
    <ThemeProvider mode={resolvedTheme as "light" | "dark" | "system"}>
      {children}
    </ThemeProvider>
  );
}
