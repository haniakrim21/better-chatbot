import { z } from "zod";

export const CanvasDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  userId: z.string(),
  threadId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CanvasDocument = z.infer<typeof CanvasDocumentSchema>;

export type CanvasDocumentRepository = {
  createDocument(
    document: Omit<CanvasDocument, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ): Promise<CanvasDocument>;

  updateDocument(
    id: string,
    document: Partial<Omit<CanvasDocument, "id" | "createdAt" | "updatedAt">>,
  ): Promise<CanvasDocument>;

  getDocument(id: string): Promise<CanvasDocument | null>;

  getDocumentsByThreadId(threadId: string): Promise<CanvasDocument[]>;

  deleteDocument(id: string): Promise<void>;
};
