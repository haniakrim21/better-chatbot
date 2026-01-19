"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import {
  createFolder,
  deleteFolder,
  getFolders,
  moveChatToFolder,
  updateFolder,
} from "@/lib/routers/folder-service";
import { revalidatePath } from "next/cache";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function createFolderAction(name: string, color?: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const folder = await createFolder(session.user.id, {
    name,
    color: color || "#888888",
  });
  revalidatePath("/");
  return folder;
}

export async function getFoldersAction() {
  const session = await getSession();
  if (!session?.user) return [];

  return await getFolders(session.user.id);
}

export async function updateFolderAction(
  folderId: string,
  name: string,
  color?: string,
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const folder = await updateFolder(session.user.id, folderId, { name, color });
  revalidatePath("/");
  return folder;
}

export async function deleteFolderAction(folderId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await deleteFolder(session.user.id, folderId);
  revalidatePath("/");
}

export async function moveChatToFolderAction(
  chatId: string,
  folderId: string | null,
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await moveChatToFolder(session.user.id, chatId, folderId);
  revalidatePath("/");
}
