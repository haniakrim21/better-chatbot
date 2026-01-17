import { z } from "zod";
import { tool } from "ai";
// WebContainer is client-side only, do not import here.

export const runTerminalCommandTool = tool({
  description:
    "Execute a shell command in the WebContainer simulation. Use this for running scripts, installing packages (npm install), or file operations.",
  parameters: z.object({
    command: z
      .string()
      .describe("The command to execute (e.g., 'npm install', 'ls -la')"),
    args: z.array(z.string()).optional().describe("Arguments for the command"),
    cwd: z
      .string()
      .optional()
      .describe("Current working directory (default: root)"),
  }),
  execute: async ({
    command,
    args = [],
    cwd,
  }: {
    command: string;
    args?: string[];
    cwd?: string;
  }): Promise<any> => {
    // We strictly return the command intent so the client can intercept and run it.
    return {
      status: "pending_client_execution",
      message: "Ready to execute in browser",
      data: {
        command,
        args,
        cwd,
      },
    };
  },
} as any);
