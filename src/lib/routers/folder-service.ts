import { pgDb as db } from "@/lib/db/pg/db.pg";
import { ChatFolderTable, ChatThreadTable } from "@/lib/db/pg/schema.pg";
import { eq, and, desc } from "drizzle-orm";
import { ChatFolderEntity } from "@/lib/db/pg/schema.pg";

export async function createFolder(
  userId: string,
  data: Pick<ChatFolderEntity, "name" | "color">,
) {
  const [folder] = await db
    .insert(ChatFolderTable)
    .values({ ...data, userId })
    .returning();
  return folder;
}

export async function getFolders(userId: string) {
  return await db
    .select()
    .from(ChatFolderTable)
    .where(eq(ChatFolderTable.userId, userId))
    .orderBy(desc(ChatFolderTable.createdAt));
}

export async function updateFolder(
  userId: string,
  folderId: string,
  data: Partial<Pick<ChatFolderEntity, "name" | "color">>,
) {
  const [updated] = await db
    .update(ChatFolderTable)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(ChatFolderTable.id, folderId), eq(ChatFolderTable.userId, userId)),
    )
    .returning();
  return updated;
}

export async function deleteFolder(userId: string, folderId: string) {
  // Chats in this folder will have their folderId set to null automatically due to "onDelete: set null" in schema
  // But we can also be explicit if needed. The schema definition handles it.
  return await db
    .delete(ChatFolderTable)
    .where(
      and(eq(ChatFolderTable.id, folderId), eq(ChatFolderTable.userId, userId)),
    );
}

export async function moveChatToFolder(
  userId: string,
  chatId: string,
  folderId: string | null,
) {
  const [updated] = await db
    .update(ChatThreadTable)
    .set({ folderId })
    .where(
      and(eq(ChatThreadTable.id, chatId), eq(ChatThreadTable.userId, userId)),
    )
    .returning();
  return updated;
}
