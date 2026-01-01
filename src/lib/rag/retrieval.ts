import { pgDb as db } from "@/lib/db/pg/db.pg";
import { DocumentChunkTable, DocumentTable } from "@/lib/db/pg/schema.pg";
import { desc, gt, sql, eq, and } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export async function findRelevantChunks(
  query: string,
  knowledgeBaseId: string,
  limit: number = 5,
  similarityThreshold: number = 0.5,
) {
  const queryVector = await generateEmbedding(query);
  // Postgres vector similarity: 1 - (embedding <=> query)
  // We use sql template tag correctly
  const similarity = sql<number>`1 - (${DocumentChunkTable.embedding} <=> ${JSON.stringify(queryVector)}::vector)`;

  const chunks = await db
    .select({
      id: DocumentChunkTable.id,
      content: DocumentChunkTable.content,
      metadata: DocumentChunkTable.metadata,
      similarity,
    })
    .from(DocumentChunkTable)
    .innerJoin(
      DocumentTable,
      eq(DocumentChunkTable.documentId, DocumentTable.id),
    )
    .where(
      and(
        eq(DocumentTable.knowledgeBaseId, knowledgeBaseId),
        gt(similarity, similarityThreshold),
      ),
    )
    .orderBy(desc(similarity))
    .limit(limit);

  return chunks;
}
