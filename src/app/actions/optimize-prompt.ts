"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const OPTIMIZER_SYSTEM_PROMPT = `
You are an Expert Prompt Engineer. Your goal is to rewrite the user's prompt to be significantly more effective for Large Language Models.

Follow these principles:
1.  **Clarity & Specificity**: Remove ambiguity. Be precise about what is needed.
2.  **Persona**: Assign a relevant role or persona to the AI (e.g., "You are a senior software engineer").
3.  **Context**: Add necessary context that might be missing but implied.
4.  **Structure**: Use a clear structure (e.g., "Context, Task, Constraints, Output Format").
5.  **Chain of Thought**: If the task is complex, ask the model to think step-by-step.
6.  **Constraints**: Clearly state what *not* to do or length limits.

Return ONLY the optimized prompt text. Do not add any conversational filler like "Here is the optimized prompt:". Just the prompt itself.
`;

export async function optimizePrompt(originalPrompt: string) {
  if (!originalPrompt || originalPrompt.trim().length === 0) {
    return "";
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"), // Use a high-quality model for optimization
      system: OPTIMIZER_SYSTEM_PROMPT,
      prompt: `Original Prompt: "${originalPrompt}"\n\nOptimized Prompt:`,
    });

    return text;
  } catch (error) {
    console.error("Failed to optimize prompt:", error);
    throw new Error("Failed to optimize prompt.");
  }
}
