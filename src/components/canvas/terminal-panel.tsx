"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { cn } from "lib/utils";
import { getWebContainerInstance } from "lib/webcontainer/instance";

export interface TerminalPanelRef {
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  executeCommand: (
    command: string,
    args: string[],
    cwd?: string,
  ) => Promise<void>;
}

interface TerminalPanelProps {
  className?: string;
}

export const TerminalPanel = forwardRef<TerminalPanelRef, TerminalPanelProps>(
  ({ className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        terminalRef.current?.write(data);
      },
      writeln: (data: string) => {
        terminalRef.current?.writeln(data);
      },
      clear: () => {
        terminalRef.current?.clear();
      },
      executeCommand: async (command: string, args: string[], cwd?: string) => {
        const term = terminalRef.current;
        if (!term) return;

        try {
          term.writeln(`\r\n\x1b[1;34m$ ${command} ${args.join(" ")}\x1b[0m`);

          const instance = await getWebContainerInstance();

          const process = await instance.spawn(command, args, {
            cwd,
          });

          process.output.pipeTo(
            new WritableStream({
              write(data) {
                term.write(data);
              },
            }),
          );

          const exitCode = await process.exit;

          if (exitCode !== 0) {
            term.writeln(`\r\n\x1b[1;31mExit code: ${exitCode}\x1b[0m`);
          }
        } catch (error: any) {
          term.writeln(`\r\n\x1b[1;31mError: ${error.message}\x1b[0m`);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: "#1e1e1e",
          foreground: "#d4d4d4",
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      const handleResize = () => {
        fitAddon.fit();
      };

      window.addEventListener("resize", handleResize);

      // Welcome message
      term.writeln("\x1b[1;32mWebContainer Terminal Initialized\x1b[0m");
      term.writeln("Ready to execute commands...");
      term.writeln("");

      return () => {
        window.removeEventListener("resize", handleResize);
        term.dispose();
      };
    }, []);

    // Observe size changes
    useEffect(() => {
      if (!containerRef.current || !fitAddonRef.current) return;
      const resizeObserver = new ResizeObserver(() => {
        fitAddonRef.current?.fit();
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    return (
      <div
        className={cn("h-full w-full bg-[#1e1e1e] p-2", className)}
        ref={containerRef}
      />
    );
  },
);

TerminalPanel.displayName = "TerminalPanel";
