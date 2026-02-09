import { generateObject } from "ai";
import { colorize } from "consola/utils";
import { customModelProvider } from "lib/ai/models";
import { memoryRepository } from "lib/db/repository";
import globalLogger from "logger";
import { z } from "zod";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", "Memory Extraction: "),
});

const MemoryExtractionSchema = z.object({
  memories: z.array(
    z.object({
      content: z
        .string()
        .describe("A concise, factual statement about the user"),
      category: z
        .enum(["preference", "fact", "project", "style", "general"])
        .describe("The category of this memory"),
    }),
  ),
});

/**
 * Extract user memories from a conversation turn.
 * Called asynchronously after chat response is saved.
 */
export async function extractAndSaveMemories(params: {
  userId: string;
  userMessage: string;
  assistantMessage: string;
  threadId: string;
}): Promise<void> {
  const { userId, userMessage, assistantMessage, threadId } = params;

  // Skip very short messages
  if (userMessage.length < 20) return;

  try {
    // Use a lightweight model for extraction
    const model = customModelProvider.getModel({
      provider: "openai",
      model: "gpt-4o-mini",
    });

    const { object } = await generateObject({
      model,
      schema: MemoryExtractionSchema,
      system: `You are a memory extraction system. Analyze the user's message and extract key facts, preferences, or important information about the user that should be remembered for future conversations.

Rules:
- Only extract genuinely useful, factual information about the user (not about the task)
- Examples of good memories: "User prefers TypeScript over JavaScript", "User works on a project called NabdGPT", "User's team uses PostgreSQL"
- Do NOT extract trivial information like greetings or generic questions
- Do NOT extract information that is only relevant to the current task
- Return an empty array if there is nothing worth remembering
- Each memory should be a single, concise sentence
- Limit to max 3 memories per message`,
      messages: [
        {
          role: "user",
          content: `User message: "${userMessage}"\n\nAssistant response (for context): "${assistantMessage.slice(0, 500)}"`,
        },
      ],
    });

    if (object.memories.length > 0) {
      // Check for duplicates
      const existing = await memoryRepository.selectByUserId(userId);
      const existingContents = existing.map((m) => m.content.toLowerCase());

      for (const memory of object.memories) {
        const isDuplicate = existingContents.some(
          (e) =>
            e.includes(memory.content.toLowerCase()) ||
            memory.content.toLowerCase().includes(e),
        );

        if (!isDuplicate) {
          await memoryRepository.insert({
            userId,
            content: memory.content,
            category: memory.category,
            source: threadId,
          });
          logger.info(`Saved memory for user ${userId}: "${memory.content}"`);
        }
      }
    }
  } catch (error) {
    // Fail silently — memory extraction is non-critical
    logger.error("Failed to extract memories", error);
  }
}
