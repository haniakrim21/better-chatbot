"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import {
  createPrompt,
  deletePrompt,
  getPrompts,
  updatePrompt,
} from "@/lib/routers/prompt-service";
import { revalidatePath } from "next/cache";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function createPromptAction(
  title: string,
  content: string,
  tags: string[] = [],
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const prompt = await createPrompt(session.user.id, { title, content, tags });
  revalidatePath("/");
  return prompt;
}

export async function getPromptsAction() {
  const session = await getSession();
  if (!session?.user) return [];

  return await getPrompts(session.user.id);
}

export async function updatePromptAction(
  promptId: string,
  title: string,
  content: string,
  tags: string[],
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const prompt = await updatePrompt(session.user.id, promptId, {
    title,
    content,
    tags,
  });
  revalidatePath("/");
  return prompt;
}

export async function deletePromptAction(promptId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await deletePrompt(session.user.id, promptId);
  revalidatePath("/");
}
