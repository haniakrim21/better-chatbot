"use server";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SmitherySearchResult {
  name: string;
  description: string;
  command: string; // The install command
}

export async function searchSmitheryAction(query: string): Promise<{
  success: boolean;
  data?: SmitherySearchResult[];
  error?: string;
}> {
  const apiKey = process.env.SMITHERY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "MISSING_API_KEY",
    };
  }

  try {
    // Note: This relies on the CLI output format being parseable.
    // Since we don't know the exact JSON output format of the CLI (it might not support --json),
    // we might have to rely on a public list for now if parsing is too brittle.
    // BUT, for this task, I will try to run it.

    // Actually, without a key I can't even test the output format.
    // So passing a dummy key finding out it fails is the only way.

    const { stdout } = await execAsync(
      `npx -y @smithery/cli search "${query}"`,
      {
        env: { ...process.env, SMITHERY_API_KEY: apiKey },
      },
    );

    // Mock parsing for now - in reality we'd need to parse the CLI table or JSON
    // If the CLI output is a list, we accept it.
    console.log("Smithery Search Output:", stdout);

    // TODO: Parse `stdout` to `SmitherySearchResult[]`
    return { success: true, data: [] };
  } catch (error: any) {
    console.error("Smithery search failed:", error);
    return { success: false, error: error.message };
  }
}
