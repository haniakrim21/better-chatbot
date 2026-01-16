import ChatBot from "@/features/chat/components/chat-bot";
import { generateUUID } from "lib/utils";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { Agent } from "app-types/agent";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  const threadId = generateUUID();
  const initialMessages: any[] = [];

  const agentId = searchParams?.agentId as string;
  let agent: Agent | null = null;

  if (agentId) {
    agent = await pgAgentRepository.selectAgentById(agentId, session.user.id);
    if (agent && agent.instructions) {
      initialMessages.push({
        role: "system",
        content: `You are an AI assistant named "${agent.name}". ${agent.description ? `Description: ${agent.description}. ` : ""}Instructions: ${agent.instructions}`,
      });
    }
  }

  const provider = searchParams?.provider as string;
  const modelName = searchParams?.model as string;

  return (
    <ChatBot
      initialMessages={initialMessages}
      threadId={threadId}
      key={threadId}
      agentName={agent?.name}
      agentAvatar={agent?.icon}
      initialModel={
        provider && modelName
          ? { provider: provider, model: modelName }
          : undefined
      }
    />
  );
}
