import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  Tool,
  UIMessage,
} from "ai";
import {
  ChatApiSchemaRequestBody,
  ChatMention,
  ChatMetadata,
} from "app-types/chat";
import { colorize } from "consola/utils";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { extractAndSaveMemories } from "lib/ai/memory/extract-memories";
import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";
import {
  buildAppDefaultToolsSystemPrompt,
  buildMcpServerCustomizationsSystemPrompt,
  buildPersonalityPresetPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
  buildUserSystemPrompt,
  CANVAS_USAGE_PROMPT,
  WORKFLOW_USAGE_PROMPT,
} from "lib/ai/prompts";
import { ImageToolName, VideoToolName } from "lib/ai/tools";
import { nanoBananaTool, openaiImageTool } from "lib/ai/tools/image";
import { videoTool } from "lib/ai/tools/video";
import { pgDb as db } from "lib/db/pg/db.pg";
import { KnowledgeBaseTable } from "lib/db/pg/schema.pg";
import {
  agentRepository,
  chatRepository,
  memoryRepository,
  skillRepository,
  userRepository,
} from "lib/db/repository";
import { serverFileStorage } from "lib/file-storage";
import { generateUUID } from "lib/utils";
import globalLogger from "logger";
import { errorIf, safe } from "ts-safe";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "@/app/api/chat/actions";
import {
  convertToSavePart,
  excludeToolExecution,
  extractInProgressToolPart,
  filterMcpServerCustomizations,
  handleError,
  loadAppDefaultTools,
  loadMcpTools,
  loadWorkFlowTools,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
} from "@/app/api/chat/shared.chat";
import { buildCsvIngestionPreviewParts } from "@/lib/ai/ingest/csv-ingest";
import { getSession } from "@/lib/auth/server";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat Service: `),
});

export class ChatService {
  async processRequest(
    session: Session,
    body: ChatApiSchemaRequestBody,
    reqSignal: AbortSignal,
  ) {
    const {
      id: rawId,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      imageTool,
      mentions = [],
      attachments = [],
      knowledgeBaseId,
      currentSelection,
      teamId,
      personalityPreset,
    } = body;

    let id = rawId;
    // Validate UUID format to prevent database crashes with invalid inputs (like emojis)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn(`Invalid UUID provided: ${id}. Generating new UUID.`);
      id = generateUUID();
    }

    // Fetch user API key if available
    let apiKey: string | undefined;
    if (chatModel?.provider) {
      try {
        // Import tableSchema to avoid circular dependency issues if any
        const { ApiKeyTable } = await import("lib/db/pg/schema.pg");
        const [keyRecord] = await db
          .select({ key: ApiKeyTable.key })
          .from(ApiKeyTable)
          .where(
            and(
              eq(ApiKeyTable.userId, session.user.id),
              eq(ApiKeyTable.provider, chatModel.provider),
            ),
          );

        if (keyRecord) {
          const { decrypt } = await import("lib/encryption");
          apiKey = decrypt(keyRecord.key);
        }
      } catch (error) {
        logger.error("Failed to fetch/decrypt user API key", error);
      }
    }

    // Check for environment variable API key if no user key is set
    if (!apiKey && chatModel?.provider) {
      const providerMap: Record<string, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        xai: process.env.XAI_API_KEY,
        groq: process.env.GROQ_API_KEY,
        openRouter: process.env.OPENROUTER_API_KEY,
        thesys: process.env.THESYS_API_KEY,
      };
      apiKey = providerMap[chatModel.provider];
    }

    // Check Usage Quota if no custom API key is present (neither user nor env)
    if (!apiKey) {
      try {
        const { UsageTrackingTable } = await import("lib/db/pg/schema.pg");
        const { DEFAULT_TOKEN_LIMIT } = await import("lib/constants");
        const [usage] = await db
          .select({
            total: sql<number>`sum(${UsageTrackingTable.totalTokens})`,
          })
          .from(UsageTrackingTable)
          .where(eq(UsageTrackingTable.userId, session.user.id));

        const totalUsage = Number(usage?.total || 0);
        if (totalUsage >= DEFAULT_TOKEN_LIMIT) {
          throw new Error(
            `Free usage quota exceeded (${DEFAULT_TOKEN_LIMIT.toLocaleString()} tokens). Please add your own API Key in Settings to continue.`,
          );
        }
      } catch (e: any) {
        if (e.message.includes("quota exceeded")) throw e;
        logger.error("Failed to check usage quota", e);
      }
    }

    const model = customModelProvider.getModel(chatModel, apiKey);

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: session.user.id,
        teamId: teamId || null,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    // Verify user access to the thread
    const teamIds = await userRepository.getTeamsByUserId(session.user.id);
    const hasAccess =
      thread!.userId === session.user.id ||
      (thread!.teamId && teamIds.includes(thread!.teamId));

    if (!hasAccess) {
      logger.error(
        `Access denied: User ${session.user.id} tried to access thread ${thread!.id} (owner: ${thread!.userId}, team: ${thread!.teamId})`,
      );
      throw new Error("Forbidden");
    }

    const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
      return {
        id: m.id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata,
      };
    });

    if (messages.at(-1)?.id == message.id) {
      messages.pop();
    }
    const ingestionPreviewParts = await buildCsvIngestionPreviewParts(
      attachments,
      (key) => serverFileStorage.download(key),
    );
    if (ingestionPreviewParts.length) {
      const baseParts = [...message.parts];
      let insertionIndex = -1;
      for (let i = baseParts.length - 1; i >= 0; i -= 1) {
        if (baseParts[i]?.type === "text") {
          insertionIndex = i;
          break;
        }
      }
      if (insertionIndex !== -1) {
        baseParts.splice(insertionIndex, 0, ...ingestionPreviewParts);
        message.parts = baseParts;
      } else {
        message.parts = [...baseParts, ...ingestionPreviewParts];
      }
    }

    if (attachments.length) {
      const firstTextIndex = message.parts.findIndex(
        (part: any) => part?.type === "text",
      );
      const attachmentParts: any[] = [];

      attachments.forEach((attachment) => {
        const exists = message.parts.some(
          (part: any) =>
            part?.type === attachment.type && part?.url === attachment.url,
        );
        if (exists) return;

        if (attachment.type === "file") {
          attachmentParts.push({
            type: "file",
            url: attachment.url,
            mediaType: attachment.mediaType,
            filename: attachment.filename,
          });
        } else if (attachment.type === "source-url") {
          attachmentParts.push({
            type: "source-url",
            url: attachment.url,
            mediaType: attachment.mediaType,
            title: attachment.filename,
          });
        }
      });

      if (attachmentParts.length) {
        if (firstTextIndex >= 0) {
          message.parts = [
            ...message.parts.slice(0, firstTextIndex),
            ...attachmentParts,
            ...message.parts.slice(firstTextIndex),
          ];
        } else {
          message.parts = [...message.parts, ...attachmentParts];
        }
      }
    }

    messages.push(message);

    const supportToolCall = !isToolCallUnsupportedModel(model);

    const agentId = (
      mentions.find((m) => m.type === "agent") as Extract<
        ChatMention,
        { type: "agent" }
      >
    )?.agentId;

    const agent = await rememberAgentAction(agentId, session.user.id);

    if (agent?.instructions?.mentions) {
      mentions.push(...agent.instructions.mentions);
    }

    // Load skills attached to the agent
    let skillsContext = "";
    if (agent?.id) {
      try {
        const agentSkills = await skillRepository.selectSkillsByAgentId(
          agent.id,
        );
        if (agentSkills.length > 0) {
          const skillPrompts = agentSkills
            .map((s) => `<skill name="${s.name}">\n${s.instructions}\n</skill>`)
            .join("\n");
          skillsContext = `<agent_skills>\n${skillPrompts}\n</agent_skills>`;
        }
      } catch (e) {
        logger.error("Failed to load agent skills", e);
      }
    }

    const { workflowId } = body;
    let workflowStructureContext = "";
    if (workflowId) {
      try {
        const { workflowRepository } = await import("lib/db/repository");
        const structure =
          await workflowRepository.selectStructureById(workflowId);
        if (structure) {
          workflowStructureContext = `\n\n<current_workflow_structure>\n${JSON.stringify(
            {
              id: structure.id,
              name: structure.name,
              nodes: structure.nodes.map((n) => ({
                id: n.id,
                name: n.name,
                kind: n.kind,
                nodeConfig: n.nodeConfig,
              })),
              edges: structure.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.uiConfig?.sourceHandle,
                targetHandle: e.uiConfig?.targetHandle,
              })),
            },
            null,
            2,
          )}\n</current_workflow_structure>\n\nYou are currently assisting the user with the workflow displayed above. You can use the workflow tools to modify its nodes and edges.`;
        }
      } catch (error) {
        logger.error("Failed to fetch workflow structure for context", error);
      }
    }

    const useImageTool = Boolean(imageTool?.model);

    const isToolCallAllowed =
      supportToolCall && (toolChoice != "none" || mentions.length > 0);

    const metadata: ChatMetadata = {
      agentId: agent?.id,
      toolChoice: toolChoice,
      toolCount: 0,
      chatModel: chatModel,
    };

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const mcpClients = await mcpClientsManager.getClients();
        const mcpTools = await mcpClientsManager.tools();
        logger.info(
          `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
        );
        logger.info(
          `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
        );
        // teamIds is already fetched above

        const MCP_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadMcpTools({
              mentions,
              allowedMcpServers,
              teamIds,
            }),
          )
          .orElse({});

        const WORKFLOW_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadWorkFlowTools({
              mentions,
              dataStream,
              userId: session.user.id,
              teamIds,
            }),
          )
          .orElse({});

        const APP_DEFAULT_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadAppDefaultTools({
              mentions,
              allowedAppDefaultToolkit,
            }),
          )
          .orElse({});
        const inProgressToolParts = extractInProgressToolPart(message);
        if (inProgressToolParts.length) {
          await Promise.all(
            inProgressToolParts.map(async (part) => {
              const output = await manualToolExecuteByLastMessage(
                part,
                { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
                reqSignal,
              );
              part.output = output;

              dataStream.write({
                type: "tool-output-available",
                toolCallId: part.toolCallId,
                output,
              });
            }),
          );
        }

        const userPreferences = thread?.userPreferences || undefined;

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        // RAG Context Injection
        let context = "";
        if (knowledgeBaseId) {
          const lastUserMessage = messages
            .slice()
            .reverse()
            .find((m) => m.role === "user");
          if (
            lastUserMessage &&
            typeof lastUserMessage.parts[0] === "object" &&
            "text" in lastUserMessage.parts[0]
          ) {
            // Verify access to knowledge base
            const [hasAccess] = await (db
              .select({ id: KnowledgeBaseTable.id as any })
              .from(KnowledgeBaseTable)
              .where(
                and(
                  eq(KnowledgeBaseTable.id as any, knowledgeBaseId),
                  or(
                    eq(KnowledgeBaseTable.userId as any, session.user.id),
                    teamIds.length > 0
                      ? inArray(KnowledgeBaseTable.teamId as any, teamIds)
                      : undefined,
                  ),
                ) as any,
              ) as any);

            if (!hasAccess) {
              logger.warn(
                `Unauthorized access attempt to knowledge base ${knowledgeBaseId} by user ${session.user.id}`,
              );
              // Fail silently or skip RAG
            } else {
              // Optimization: Only use text parts
              // We need to import findRelevantChunks.
              // Assuming dynamic import or top-level import. Top-level is better.
              try {
                const { findRelevantChunks } = await import(
                  "@/lib/rag/retrieval"
                );
                const query =
                  (
                    messages
                      .filter((m) => m.role === "user")
                      .slice(-1)[0]
                      ?.parts.find((p) => p.type === "text") as any
                  )?.text || "";
                if (query) {
                  const chunks = await findRelevantChunks(
                    query,
                    knowledgeBaseId,
                  );
                  if (chunks.length > 0) {
                    context =
                      "Use the following context to answer the user's question:\n\n" +
                      chunks.map((c: any) => c.content).join("\n\n");
                  }
                }
              } catch (e) {
                logger.error("RAG Retrieval Failed", e);
              }
            }
          }
        }

        if (currentSelection) {
          context += `\n\n<current_canvas_selection>\n${currentSelection}\n</current_canvas_selection>\n\nThe user has selected the text above in the canvas. Use this as context for their request, especially if they refer to "this" or "selected text". To edit it, use the 'EditSelection' tool.`;
        }

        // Inject user memories
        let memoryContext = "";
        try {
          const memories = await memoryRepository.selectByUserId(
            session.user.id,
          );
          if (memories.length > 0) {
            const memoryLines = memories
              .slice(0, 20)
              .map((m) => `- ${m.content}`)
              .join("\n");
            memoryContext = `
<user_memories>
These are facts you have learned about this user from previous conversations. Use them to personalize your responses when relevant, but do not explicitly mention that you are using memories:
${memoryLines}
</user_memories>`;
          }
        } catch (e) {
          logger.error("Failed to fetch user memories", e);
        }

        const baseSystemPrompt = mergeSystemPrompt(
          buildUserSystemPrompt(session.user, userPreferences, agent),
          memoryContext,
          skillsContext,
          buildPersonalityPresetPrompt(personalityPreset),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
          CANVAS_USAGE_PROMPT,
          WORKFLOW_USAGE_PROMPT,
          workflowStructureContext,
          context,
        );

        const APP_DEFAULT_TOOLS_PROMPT = buildAppDefaultToolsSystemPrompt(
          allowedAppDefaultToolkit ?? [],
        );

        const systemPrompt = mergeSystemPrompt(
          baseSystemPrompt,
          APP_DEFAULT_TOOLS_PROMPT,
        );

        const IMAGE_TOOL: Record<string, Tool> = {};
        if (chatModel?.provider === "google") {
          IMAGE_TOOL[ImageToolName] = nanoBananaTool;
          IMAGE_TOOL[VideoToolName] = videoTool;
        } else if (chatModel?.provider === "openai") {
          IMAGE_TOOL[ImageToolName] = openaiImageTool;
        }
        const vercelAITools = safe({
          ...MCP_TOOLS,
          ...WORKFLOW_TOOLS,
        })
          .map((t) => {
            if (
              toolChoice === "none" ||
              (message.metadata as ChatMetadata)?.toolChoice === "none"
            ) {
              return {};
            }

            const bindingTools =
              toolChoice === "manual" ||
              (message.metadata as ChatMetadata)?.toolChoice === "manual"
                ? excludeToolExecution(t)
                : t;
            return {
              ...bindingTools,
              ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
              ...IMAGE_TOOL,
            };
          })
          .unwrap();
        metadata.toolCount = Object.keys(vercelAITools).length;

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => t.tools)
          .flat();

        if (Object.keys(APP_DEFAULT_TOOLS).length > 0) {
          logger.info(
            `App Default Tools Loaded: ${Object.keys(APP_DEFAULT_TOOLS).join(", ")}`,
          );
        }

        logger.info(
          `${agent ? `agent: ${agent.name}, ` : ""}tool mode: ${toolChoice}, mentions: ${mentions.length}, default toolkits: ${(allowedAppDefaultToolkit ?? []).join(", ")}`,
        );

        logger.info(
          `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
        );
        if (useImageTool) {
          logger.info(`binding tool count Image: ${imageTool?.model}`);
        } else {
          logger.info(
            `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
          );
        }

        logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);

        // Truncate messages to prevent context length errors
        // Keep the most recent messages to stay within context window
        // Heuristic: 1 token ~= 4 chars. 50k chars ~= 12.5k tokens.
        // This is a safe upper bound for most modern models (GPT-4o, Claude 3.5, etc.)
        const MAX_CONTEXT_CHARS = 50000;
        let runningCharCount = 0;
        let truncatedMessages: UIMessage[] = [];

        // Iterate backwards to keep the most recent messages
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          let msgLength = 0;

          for (const part of msg.parts) {
            const p = part as any; // Cast to any to handle all part types without TS errors
            if (p.type === "text") {
              msgLength += (p.text || "").length;
            } else if (
              p.type === "image" ||
              p.type === "file" ||
              p.imageUrl ||
              p.image
            ) {
              // Heuristic: Large files/images consume significant context.
              // Assign a heavy weight. 1M tokens is the hard limit, but we want to stay well below.
              // Let's assume an image is ~1k tokens -> ~4k chars.
              // But to be safe and "dont show this error", we treat them as expensive.
              msgLength += 10000;
            }
          }

          if (runningCharCount + msgLength > MAX_CONTEXT_CHARS) {
            // If the single latest message is too big, we still have to let it through (or part of it)
            // but we stop adding older history.
            if (truncatedMessages.length === 0) {
              truncatedMessages.push(msg);
            }
            break;
          }

          runningCharCount += msgLength;
          truncatedMessages.unshift(msg);
        }

        // Always ensure at least the last user message is present if possible,
        // effectively protecting against empty context if a single message is massive (though unlikely to help if it's > max context alone)
        if (truncatedMessages.length === 0 && messages.length > 0) {
          truncatedMessages.push(messages[messages.length - 1]);
        }

        // Ensure we don't start with a tool result without its assistant call
        // This is a common cause of "messages do not match the ModelMessage[] schema"
        if (
          truncatedMessages.length > 0 &&
          ((truncatedMessages[0].role as string) === "tool" ||
            (truncatedMessages[0].role as string) === "data")
        ) {
          const firstIndexInOriginal = messages.indexOf(truncatedMessages[0]);
          if (firstIndexInOriginal > 0) {
            const potentialAssistant = messages[firstIndexInOriginal - 1];
            if (potentialAssistant.role === "assistant") {
              truncatedMessages = [potentialAssistant, ...truncatedMessages];
            }
          }
        }

        logger.info(
          `Message truncation: ${messages.length} total messages, using ${truncatedMessages.length} in context`,
        );

        const coreMessages = await convertToCoreMessages(truncatedMessages);
        const totalCharCount =
          systemPrompt.length + JSON.stringify(coreMessages).length;
        logger.info(
          `Context summary: SystemPrompt: ${systemPrompt.length} chars, Messages: ${JSON.stringify(coreMessages).length} chars, Total approx: ${totalCharCount} chars`,
        );

        const result = streamText({
          model,
          system: systemPrompt,
          messages: coreMessages,
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 2,
          tools: vercelAITools,
          stopWhen: stepCountIs(10),
          toolChoice: "auto",
          abortSignal: reqSignal,
        });
        dataStream.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type == "finish") {
                metadata.usage = part.totalUsage;
                return metadata;
              }
            },
          }),
        );
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        // Track Usage from metadata
        const usage = metadata.usage;
        if (usage && chatModel) {
          try {
            const { UsageTrackingTable } = await import("lib/db/pg/schema.pg");
            await db.insert(UsageTrackingTable).values({
              userId: session.user.id,
              modelId: chatModel.model,
              provider: chatModel.provider,
              inputTokens: (usage as any).promptTokens || 0,
              outputTokens: (usage as any).completionTokens || 0,
              totalTokens: usage.totalTokens,
            });
          } catch (error) {
            logger.error("Failed to track usage", error);
          }
        }

        if (responseMessage.id == message.id) {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            ...responseMessage,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        } else {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: message.parts.map(convertToSavePart),
            id: message.id,
            userId: session.user.id,
          });
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: responseMessage.role,
            id: responseMessage.id,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        }

        if (agent) {
          agentRepository.updateAgent(agent.id, session.user.id, {
            updatedAt: new Date(),
          } as any);
        }

        // Async memory extraction (fire-and-forget)
        const userText = message.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join(" ");
        const assistantText = responseMessage.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join(" ");
        if (userText.length > 20) {
          extractAndSaveMemories({
            userId: session.user.id,
            userMessage: userText,
            assistantMessage: assistantText,
            threadId: thread!.id,
          }).catch(() => {});
        }
      },
      onError: handleError,
      originalMessages: messages,
    });

    return createUIMessageStreamResponse({
      stream,
    });
  }

  /**
   * Non-streaming version of processRequest for service-to-service calls (e.g. Multi-Agent)
   */
  async processServiceRequest(params: {
    userId: string;
    threadId: string;
    agentId: string;
    lastMessageContent: string;
    systemPromptOverride?: string;
  }) {
    const {
      userId,
      threadId,
      agentId,
      lastMessageContent,
      systemPromptOverride,
    } = params;

    // Fetch agent details
    const agent = await agentRepository.selectAgentById(agentId, userId);
    if (!agent) throw new Error("Agent not found");

    // Fetch user for the session
    const user = await (userRepository as any).getUserById(userId);
    if (!user) throw new Error("User not found");

    // Construct the request body
    const body: any = {
      id: threadId,
      message: {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: lastMessageContent }],
      },
      chatModel: (agent.instructions as any)?.chatModel || {
        provider: "openai",
        modelId: "gpt-4o",
      },
      mentions: [{ type: "agent", agentId }],
    };

    // We use generateText (non-streaming) from 'ai' instead of streamText
    // But since ChatService is heavily geared towards streaming, we'll manually
    // reconstruct the logic or call handleFinish behavior.

    // For now, let's implement a simplified version of the completion logic
    const model = customModelProvider.getModel(body.chatModel);

    // Fetch conversation history
    const thread = await chatRepository.selectThreadDetails(threadId);
    const history = (thread?.messages || []).map((m) => ({
      role: m.role,
      content: m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n"),
    }));

    // Add current message
    history.push({ role: "user", content: lastMessageContent });

    const { generateText } = await import("ai");

    const result = await generateText({
      model: model as any,
      system: systemPromptOverride || agent.instructions?.systemPrompt || "",
      messages: history as any[],
    });

    // Save the response message to DB
    const assistantMessageId = generateUUID();
    await chatRepository.insertMessage({
      id: assistantMessageId,
      threadId,
      role: "assistant",
      parts: [{ type: "text", text: result.text }],
      userId,
    });

    return { content: result.text, messageId: assistantMessageId };
  }
}

export const chatService = new ChatService();

async function convertToCoreMessages(messages: any[]): Promise<any[]> {
  const coreMessages: any[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      const parts = await Promise.all(
        message.parts.map(async (part: any) => {
          if (part.type === "text") {
            return { type: "text", text: part.text };
          } else if (part.type === "image") {
            try {
              if (
                part.url?.startsWith("/") ||
                part.url?.includes("72.62.190.235")
              ) {
                const key = part.url.replace(/^\//, "");
                const exists = await serverFileStorage.exists(key);
                if (exists) {
                  const buffer = await serverFileStorage.download(key);
                  return {
                    type: "image",
                    image: buffer,
                  };
                }
              }
            } catch (error) {
              logger.error(
                `Failed to convert image url to buffer: ${part.url}`,
                error,
              );
            }
            return { type: "image", image: part.url || "" };
          } else if (part.type === "file") {
            // Check if it's an image file and convert to image part for vision compatibility
            const isImage =
              part.mediaType?.startsWith("image/") ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(part.url || "");

            if (isImage) {
              try {
                if (
                  part.url?.startsWith("/") ||
                  part.url?.includes("72.62.190.235")
                ) {
                  const key = part.url.replace(/^\//, "");
                  const exists = await serverFileStorage.exists(key);
                  if (exists) {
                    const buffer = await serverFileStorage.download(key);
                    return {
                      type: "image",
                      image: buffer,
                    };
                  }
                }
              } catch (error) {
                logger.error(
                  `Failed to convert image file to buffer: ${part.url}`,
                  error,
                );
              }
              return { type: "image", image: part.url || "" };
            }

            return {
              type: "file",
              data: part.url,
              mimeType: part.mediaType || "application/octet-stream",
            };
          }
          return null;
        }),
      );

      const filteredParts = parts.filter(
        (p: any) => p !== null && (p.type !== "text" || p.text !== ""),
      );

      if (filteredParts.length > 0) {
        coreMessages.push({
          role: "user",
          content: filteredParts,
        });
      }
    } else if (message.role === "assistant") {
      const parts = message.parts
        .map((part: any) => {
          if (part.type === "text") {
            return { type: "text", text: part.text };
          } else if (part.type === "tool-invocation") {
            return {
              type: "tool-call",
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: part.args,
            };
          }
          return null;
        })
        .filter((p: any) => p !== null);

      if (parts.length > 0) {
        coreMessages.push({
          role: "assistant",
          content: parts as any,
        });
      }
    } else if (message.role === "tool" || message.role === "data") {
      const toolResults = message.parts
        .map((p: any) => {
          if (p.type === "tool-invocation" || p.type === "tool-result") {
            let result =
              "result" in p ? p.result : "output" in p ? p.output : undefined;
            const toolName = p.toolName?.toLowerCase() || "";

            // Aggressively remove screenshots from context (AI can't use base64 effectively)
            if (
              toolName.includes("screenshot") ||
              toolName.includes("snapshot")
            ) {
              result =
                "[Screenshot/Snapshot data removed from context to save space]";
            } else if (typeof result === "string" && result.length > 10000) {
              result = result.slice(0, 10000) + "... [Output truncated]";
            } else if (result && typeof result === "object") {
              const str = JSON.stringify(result);
              if (str.length > 10000) {
                result = str.slice(0, 10000) + "... [Output truncated]";
              }
            }

            return {
              type: "tool-result",
              toolCallId: p.toolCallId,
              toolName: p.toolName,
              result,
            };
          }
          return null;
        })
        .filter((p: any) => p !== null) as any;

      if (toolResults.length > 0) {
        coreMessages.push({
          role: "tool",
          content: toolResults,
        });
      }
    }
  }
  return coreMessages;
}
