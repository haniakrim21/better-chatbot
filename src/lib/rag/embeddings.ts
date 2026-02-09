import { embed, embedMany } from "ai";
import { google } from "lib/ai/models";

const embeddingModel = google.textEmbeddingModel("text-embedding-004");

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
