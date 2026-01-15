import { embed, embedMany } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/api",
});

const embeddingModel = ollama.textEmbeddingModel("nomic-embed-text");

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: texts,
    });
    return embeddings;
  } catch (error) {
    console.error("Batch embedding generation failed:", error);
    throw error;
  }
}
