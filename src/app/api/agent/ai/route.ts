import { streamObject } from "ai";

import { customModelProvider } from "lib/ai/models";
import globalLogger from "logger";
import { ChatModel } from "app-types/chat";

import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { z } from "zod";
import { loadAppDefaultTools } from "../../chat/shared.chat";
import { workflowRepository } from "lib/db/repository";
import { safe } from "ts-safe";
import { objectFlow } from "lib/utils";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Agent Generate API: `),
});

// FIX: Define a stable schema for generation that avoids complex arrays or large text fields
// This addresses the issue where streamObject fails with 0 bytes when requesting complex 'tools' arrays or long 'instructions'
const generationSchema = z.object({
  name: z.string().describe("Agent name"),
  description: z.string().describe("Agent description"),
  role: z.string().describe("Agent role"),
  instructions: z
    .string()
    .describe("A short summary of the agent's system instructions"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { chatModel, message } = json as {
      chatModel?: ChatModel;
      message: string;
    };

    logger.info(`chatModel: ${chatModel?.provider}/${chatModel?.model}`);

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const toolNames = new Set<string>();

    await safe(loadAppDefaultTools)
      .ifOk((appTools) => {
        objectFlow(appTools).forEach((_, toolName) => {
          toolNames.add(toolName);
        });
      })
      .unwrap();

    await safe(mcpClientsManager.tools())
      .ifOk((tools) => {
        objectFlow(tools).forEach((mcp) => {
          toolNames.add(mcp._originToolName);
        });
      })
      .unwrap();

    await safe(workflowRepository.selectExecuteAbility(session.user.id))
      .ifOk((tools) => {
        tools.forEach((tool) => {
          toolNames.add(tool.name);
        });
      })
      .unwrap();

    // FIX: Custom prompt that requests a simpler output format to ensure stability
    const toolsList = Array.from(toolNames)
      .map((name) => `- ${name}`)
      .join("\n");

    const systemPrompt = `
You are an elite AI agent architect. Your mission is to translate user requirements into robust, high-performance agent configurations. Follow these steps for every request:

1. Extract Core Intent: Carefully analyze the user's input to identify the fundamental purpose, key responsibilities, and success criteria for the agent. Consider both explicit and implicit needs.

2. Design Expert Persona: Define a compelling expert identity for the agent, ensuring deep domain knowledge and a confident, authoritative approach to decision-making.

3. Architect Comprehensive Instructions: (Internal Step) Formulate the system prompt in your mind that clearly defines the agent's behavioral boundaries, methodologies, and quality control steps.

4. Strategic Tool Selection: (Internal Step) Consider which tools are crucially necessary from the available list:
${toolsList}

5. Output Generation: Return a structured object with these fields:
- name: Concise, descriptive name reflecting the agent's primary function
- description: 1-2 sentences capturing the unique value and primary benefit to users
- role: Precise domain-specific expertise area
- instructions: A short summary of the instructions designed in step 3. 
(Note: Do not output the tools list in the JSON to ensure generation stability)

CRITICAL: Generate all output content in the same language as the user's request. Be specific and comprehensive. Proactively seek clarification if requirements are ambiguous. Your output should enable the new agent to operate autonomously and reliably within its domain.`.trim();

    const result = streamObject({
      model: customModelProvider.getModel(chatModel),
      system: systemPrompt,
      prompt: message,
      schema: generationSchema,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error(error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}
