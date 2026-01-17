import { CanvasDocumentRepository } from "app-types/canvas";
import { pgDb as db } from "../db.pg";
import { CanvasDocumentTable } from "../schema.pg";
import { eq, desc } from "drizzle-orm";

export const pgCanvasDocumentRepository: CanvasDocumentRepository = {
  createDocument: async (document) => {
    const [result] = await db
      .insert(CanvasDocumentTable)
      .values({
        title: document.title,
        content: document.content,
        userId: document.userId,
        threadId: document.threadId,
      })
      .returning();
    return result;
  },

  updateDocument: async (id, document) => {
    const [result] = await db
      .update(CanvasDocumentTable)
      .set({
        ...document,
        updatedAt: new Date(),
      })
      .where(eq(CanvasDocumentTable.id, id))
      .returning();
    return result;
  },

  getDocument: async (id) => {
    const [result] = await db
      .select()
      .from(CanvasDocumentTable)
      .where(eq(CanvasDocumentTable.id, id));
    return result || null;
  },

  getDocumentsByThreadId: async (threadId) => {
    const results = await db
      .select()
      .from(CanvasDocumentTable)
      .where(eq(CanvasDocumentTable.threadId, threadId))
      .orderBy(desc(CanvasDocumentTable.updatedAt));
    return results;
  },

  deleteDocument: async (id) => {
    await db.delete(CanvasDocumentTable).where(eq(CanvasDocumentTable.id, id));
  },
};
