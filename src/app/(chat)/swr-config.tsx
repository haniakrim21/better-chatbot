"use client";

import { BasicUser } from "app-types/user";
import { useEffect, useMemo } from "react";
import { SWRConfig, SWRConfiguration } from "swr";

export function SWRConfigProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: BasicUser;
}) {
  const config = useMemo<SWRConfiguration>(() => {
    return {
      focusThrottleInterval: 30000,
      dedupingInterval: 2000,
      errorRetryCount: 1,
      fallback: {
        "/api/user/details": user,
      },
    };
  }, [user]);

  useEffect(() => {
    console.log(
      "%c█▄▄ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█\n█▄█ █▄▄  █   █  █▄▄ █▀▄\n\n%c⛓️ Just a Better Chatbot\nhttps://github.com/cgoinglove/better-chatbot",
      "font-family:monospace;color:transparent;font-size:30px;-webkit-text-stroke:2px #3b82f6;text-shadow: 0 0 10px rgba(59,130,246,0.3);",
      "font-family:monospace;font-size:14px;color:#888;",
    );
    console.log(
      "%cNabdGPT",
      "font-family:sans-serif;font-size:24px;font-weight:bold;color:#a855f7;text-shadow: 0 0 20px rgba(168,85,247,0.5);",
    );
  }, []);
  return <SWRConfig value={config}>{children}</SWRConfig>;
}
