import { tool } from "ai";
import { z } from "zod";
import { findRelevantChunks } from "@/lib/rag/retrieval";

export const retrieveKnowledgeTool = tool({
  description:
    "Retrieve relevant information from the knowledge base. Use this to answer questions based on the user's documents.",
  inputSchema: z.object({
    query: z.string().describe("The query to search for in the knowledge base"),
    knowledgeBaseId: z
      .string()
      .describe("The ID of the knowledge base to search"),
  }),
  execute: async ({ query, knowledgeBaseId }) => {
    try {
      if (!knowledgeBaseId) {
        return {
          error: "No knowledge base ID provided.",
        };
      }

      const chunks = await findRelevantChunks(query, knowledgeBaseId);

      if (chunks.length === 0) {
        return {
          message: "No relevant information found.",
        };
      }

      return {
        results: chunks.map((c) => ({
          content: c.content,
          similarity: c.similarity,
        })),
      };
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  },
});
