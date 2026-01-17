import { z } from "zod";
import { tool } from "ai";

export const draftContentTool = tool({
  description:
    "Draft or write long-form content to the canvas editor. Use this when the user asks for a blog post, article, report, or any substantial text generation that should be editable.",
  parameters: z.object({
    title: z.string().describe("The title of the document"),
    content: z.string().describe("The full markdown content of the document"),
    action: z
      .enum(["create", "update", "append"])
      .describe(
        "Whether to create a new document, replace existing content, or append to it. Default is create.",
      ),
  }),
  execute: async ({ title, content, action }): Promise<any> => {
    // Import dynamically or at top-level. Top level is circular? No.
    // But we need to use 'repository' and 'getSession'
    const { canvasDocumentRepository } = await import("lib/db/repository");
    const { getSession } = await import("auth/server");

    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const doc = await canvasDocumentRepository.createDocument({
      title,
      content,
      userId: session.user.id,
      threadId: null, // We don't have threadId in method args yet, could pass it potentially?
    });

    return {
      status: "success",
      message: `Drafted content for "${title}"`,
      data: {
        documentId: doc.id,
        title,
        content,
        action,
      },
    };
  },
} as any);
