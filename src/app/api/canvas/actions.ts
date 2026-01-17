"use server";

import { canvasDocumentRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { CanvasDocument } from "app-types/canvas";

export async function getUserId() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found");
  }
  return userId;
}

export async function getCanvasDocumentAction(id: string) {
  const userId = await getUserId();
  const document = await canvasDocumentRepository.getDocument(id);

  if (!document) return null;
  if (document.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return document;
}

export async function saveCanvasDocumentAction(
  document: Omit<
    CanvasDocument,
    "createdAt" | "updatedAt" | "userId" | "threadId"
  > & { id?: string; threadId?: string | null },
) {
  const userId = await getUserId();

  if (document.id) {
    const existing = await canvasDocumentRepository.getDocument(document.id);
    if (existing && existing.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Check if updating or creating with ID (Drizzle upsert might be better, but updateDocument is what we have)
    if (existing) {
      return await canvasDocumentRepository.updateDocument(document.id, {
        ...document,
        userId, // Ensure userId is preserved/enforced
      });
    }
  }

  // Create new
  return await canvasDocumentRepository.createDocument({
    ...document,
    userId,
    threadId: document.threadId ?? null,
  });
}
