import { tool } from "ai";
import { z } from "zod";

/**
 * Document Generation Tool
 *
 * The AI provides structured content, and the client-side renderer
 * generates + downloads the actual file (PDF, XLSX, PPTX).
 */
export const generateDocumentTool = tool({
  description:
    "Generate a document (PDF, XLSX, or PPTX) from structured content. Use this when the user asks you to create, export, or download a document file. The document will be rendered and downloaded on the client side.",
  inputSchema: z.object({
    format: z
      .enum(["pdf", "xlsx", "pptx"])
      .describe("The output format of the document"),
    title: z.string().describe("The title of the document"),
    content: z
      .array(
        z.object({
          type: z
            .enum(["heading", "paragraph", "table", "list", "code"])
            .describe("The type of content block"),
          text: z
            .string()
            .optional()
            .describe("Text content for heading, paragraph, and code blocks"),
          level: z
            .number()
            .optional()
            .describe("Heading level (1-3) for heading blocks"),
          items: z
            .array(z.string())
            .optional()
            .describe("Items for list blocks"),
          rows: z
            .array(z.array(z.string()))
            .optional()
            .describe(
              "Table rows. First row is the header. Each inner array is a row of cells.",
            ),
          language: z
            .string()
            .optional()
            .describe("Programming language for code blocks"),
        }),
      )
      .describe("Array of content blocks that make up the document"),
    filename: z
      .string()
      .optional()
      .describe("Optional custom filename (without extension)"),
  }),
  execute: async ({ format, title, content, filename }) => {
    return JSON.stringify({
      status: "success",
      message: `Document "${title}" ready for download as ${format.toUpperCase()}.`,
      data: {
        format,
        title,
        content,
        filename: filename || title.replace(/[^a-zA-Z0-9-_ ]/g, ""),
      },
    });
  },
});
