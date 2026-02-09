import { tool } from "ai";
import { z } from "zod";

export const draftContentTool = tool({
  description:
    "Draft or write long-form content to the canvas editor. Use this when the user asks for a blog post, article, report, or any substantial text generation that should be editable.",
  inputSchema: z.object({
    title: z.string().describe("The title of the document"),
    content: z.string().describe("The full markdown content of the document"),
    action: z
      .enum(["create", "update", "append"])
      .default("create")
      .describe(
        "Whether to create a new document, replace existing content, or append to it. Default is create.",
      ),
  }),
  execute: async ({ title, content, action }) => {
    const { canvasDocumentRepository } = await import("lib/db/repository");
    const { getSession } = await import("auth/server");

    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (action === "update" || action === "append") {
      // Try to find an existing document with this title for the user
      // We search the most recent documents to find a match
      const { pgDb: db } = await import("lib/db/pg/db.pg");
      const { CanvasDocumentTable } = await import("lib/db/pg/schema.pg");
      const { eq, and, desc } = await import("drizzle-orm");

      const [existing] = await db
        .select()
        .from(CanvasDocumentTable)
        .where(
          and(
            eq(CanvasDocumentTable.userId, session.user.id),
            eq(CanvasDocumentTable.title, title),
          ),
        )
        .orderBy(desc(CanvasDocumentTable.updatedAt))
        .limit(1);

      if (existing) {
        const newContent =
          action === "append"
            ? `${existing.content || ""}\n\n${content}`
            : content;

        const doc = await canvasDocumentRepository.updateDocument(existing.id, {
          title,
          content: newContent,
          userId: session.user.id,
          threadId: existing.threadId,
        });

        return {
          status: "success",
          message:
            action === "append"
              ? `Appended content to "${title}"`
              : `Updated content for "${title}"`,
          data: {
            documentId: doc.id,
            title,
            content: newContent,
            action,
          },
        };
      }
      // Fall through to create if no existing document found
    }

    const doc = await canvasDocumentRepository.createDocument({
      title,
      content,
      userId: session.user.id,
      threadId: null,
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
});
