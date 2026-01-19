import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/features/chat/components/chat-bot";

import { ChatMessage, ChatThread } from "app-types/chat";
import { redirect, RedirectType } from "next/navigation";

const fetchThread = async (
  threadId: string,
): Promise<(ChatThread & { messages: ChatMessage[] }) | null> => {
  return await selectThreadWithMessagesAction(threadId);
};

export default async function Page({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  const { getSession } = await import("lib/auth/server");
  const session = await getSession();

  if (!thread) redirect("/", RedirectType.replace);

  return (
    <ChatBot
      threadId={threadId}
      initialMessages={thread.messages}
      currentUserId={session?.user.id}
    />
  );
}
