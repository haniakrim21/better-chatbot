import { z } from "zod";
import { tool } from "ai";

export const editSelectionTool = tool({
  description:
    "Edit formatted text, code, or specific sections of a document. Use this to refine, rewrite, or fix selection in the canvas.",
  inputSchema: z.object({
    instruction: z
      .string()
      .describe("The instruction for how to edit the selected text"),
    replacement: z
      .string()
      .optional()
      .describe("The new text to replace the selection with (if applicable)"),
  }),
  execute: async ({ instruction, replacement }) => {
    return {
      status: "success",
      message: `Executed edit with instruction: "${instruction}"`,
      data: {
        instruction,
        replacement,
        action: "EditSelection",
      },
    };
  },
});
