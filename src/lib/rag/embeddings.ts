import { HfInference } from "@huggingface/inference";

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
const MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";

if (!HF_TOKEN) {
  console.warn("HUGGINGFACE_API_KEY is missing. Embeddings will fail.");
}

const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!hf) throw new Error("Hugging Face API key missing");
  try {
    const result = await hf.featureExtraction({
      model: MODEL_ID,
      inputs: text,
    });
    // Ensure we get a 1D array of numbers
    if (Array.isArray(result) && typeof result[0] === "number") {
      return result as number[];
    }
    // Handle nested case [[...]]
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as number[];
    }
    throw new Error("Unexpected embedding format from HF");
  } catch (e) {
    console.error("Embedding generation failed", e);
    throw e;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!hf) throw new Error("Hugging Face API key missing");
  try {
    const result = await hf.featureExtraction({
      model: MODEL_ID,
      inputs: texts,
    });

    // Check for [ [emb1], [emb2] ]
    if (Array.isArray(result) && Array.isArray(result[0])) {
      // Validate that inner arrays are numbers (basic check)
      if (result.length > 0 && typeof result[0][0] === "number") {
        return result as number[][];
      }
      // If result[0][0] is NOT number, it might be deeper nesting or object?
      // Usually featureExtraction for list returns (number|number[])[]
      // For 'sentence-transformers/all-MiniLM-L6-v2', it returns number[][]
      return result as number[][];
    }
    throw new Error("Unexpected batched embedding format from HF");
  } catch (e) {
    console.error("Batch embedding generation failed", e);
    throw e;
  }
}
