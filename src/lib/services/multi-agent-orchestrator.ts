import { UIMessage } from "ai";
import { chatService } from "./chat-service";
import { chatRepository } from "lib/db/repository";
import logger from "logger";
import { generateUUID } from "lib/utils";

export interface MultiAgentRole {
  name: string;
  agentId: string;
  systemPromptPreset?: string;
}

export interface MultiAgentSessionConfig {
  taskDescription: string;
  userRole: MultiAgentRole;
  assistantRole: MultiAgentRole;
  maxTurns: number;
  userId: string;
  threadId?: string;
}

export class MultiAgentOrchestrator {
  /**
   * Generates inception prompts for both User and Assistant agents
   */
  private generateInceptionPrompts(config: MultiAgentSessionConfig) {
    const { taskDescription, userRole, assistantRole } = config;

    const userSystemPrompt = `You are a ${userRole.name}. 
Your task is to work with a ${assistantRole.name} to complete the following: "${taskDescription}".
You are the one who provides specific instructions and feedback to the ${assistantRole.name}.
Do not repeat the high-level task description in every message. Be concise and move the project forward.
Start by providing the first specific instruction to the ${assistantRole.name}.
Always aim for Task Completion. If the task is finished, say <TASK_DONE>.`;

    const assistantSystemPrompt = `You are a ${assistantRole.name}.
Your task is to work with a ${userRole.name} to complete the following: "${taskDescription}".
You should follow the instructions provided by the ${userRole.name} and provide solutions, code, or creative output as requested.
Do not repeat the high-level task description in every message.
Wait for the ${userRole.name} to provide instructions.`;

    return { userSystemPrompt, assistantSystemPrompt };
  }

  /**
   * Runs a complete Camel Role-Playing session
   */
  async runSession(
    config: MultiAgentSessionConfig,
    onProgress?: (message: UIMessage) => void,
  ) {
    const { userId, maxTurns, userRole, assistantRole } = config;
    const threadId = config.threadId || generateUUID();

    const { userSystemPrompt, assistantSystemPrompt } =
      this.generateInceptionPrompts(config);

    // Initial state
    let turn = 0;
    let lastMessageContent =
      "Please start our collaboration on: " + config.taskDescription;
    let isFinished = false;

    logger.info(
      `Starting Multi-Agent Session: ${threadId} (Max Turns: ${maxTurns})`,
    );

    // Update thread title to reflect the task
    try {
      await chatRepository.updateThread(threadId, {
        title: `Collaboration: ${config.taskDescription.slice(0, 40)}...`,
      });
    } catch (err) {
      logger.warn(`Failed to update thread title for ${threadId}:`, err);
    }

    // Step 1: User Agent starts the conversation
    while (turn < maxTurns && !isFinished) {
      turn++;

      // Determine whose turn it is
      const isUserAgentTurn = turn % 2 !== 0; // Odd turns: User Agent (A), Even turns: Assistant Agent (B)
      const currentRole = isUserAgentTurn ? userRole : assistantRole;
      const currentSystemPrompt = isUserAgentTurn
        ? userSystemPrompt
        : assistantSystemPrompt;
      const currentSenderLabel = isUserAgentTurn
        ? userRole.name
        : assistantRole.name;

      logger.debug(`Turn ${turn}: ${currentSenderLabel}`);

      try {
        // Construct prompt for the current agent
        // In Camel, the "lastMessageContent" from the other agent is the new message for this one
        const response = await (chatService as any).processServiceRequest({
          userId,
          threadId,
          agentId: currentRole.agentId,
          systemPromptOverride: currentSystemPrompt,
          lastMessageContent: lastMessageContent,
        });

        const newMessage: UIMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text", text: response.content }],
          createdAt: new Date(),
          metadata: {
            camelRole: isUserAgentTurn ? "user_agent" : "assistant_agent",
            agentName: currentSenderLabel,
            turn: turn,
            status: isFinished ? "completed" : "in_progress",
          },
        } as any;

        // Update state for next turn
        lastMessageContent = response.content;

        if (onProgress) onProgress(newMessage);

        if (response.content.includes("<TASK_DONE>")) {
          isFinished = true;
          logger.info(`Multi-Agent Session ${threadId} completed via tag.`);
        }
      } catch (error) {
        logger.error(
          `Multi-Agent Session ${threadId} failed at turn ${turn}:`,
          error,
        );
        throw error;
      }
    }

    return {
      threadId,
      turns: turn,
      completed: isFinished,
      lastMessage: lastMessageContent,
    };
  }
}

export const multiAgentOrchestrator = new MultiAgentOrchestrator();
