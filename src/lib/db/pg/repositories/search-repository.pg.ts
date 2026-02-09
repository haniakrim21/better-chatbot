import { and, desc, eq, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { ChatMessageTable, ChatThreadTable } from "../schema.pg";

export type SearchResult = {
  threadId: string;
  threadTitle: string;
  messageId: string;
  role: string;
  snippet: string;
  createdAt: Date;
};

export const pgSearchRepository = {
  /**
   * Full-text search across all chat messages for a user.
   * Uses PostgreSQL's to_tsvector/to_tsquery for efficient search.
   */
  async search(
    userId: string,
    query: string,
    limit: number = 20,
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Sanitize query for tsquery: replace special chars, convert spaces to &
    const sanitized = query
      .replace(/[^\w\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(" & ");

    if (!sanitized) return [];

    const results = await db
      .select({
        threadId: ChatThreadTable.id,
        threadTitle: ChatThreadTable.title,
        messageId: ChatMessageTable.id,
        role: ChatMessageTable.role,
        parts: ChatMessageTable.parts,
        createdAt: ChatMessageTable.createdAt,
      })
      .from(ChatMessageTable)
      .innerJoin(
        ChatThreadTable,
        eq(ChatMessageTable.threadId, ChatThreadTable.id),
      )
      .where(
        and(
          eq(ChatThreadTable.userId, userId),
          sql`to_tsvector('english', coalesce(
            (SELECT string_agg(elem->>'text', ' ')
             FROM jsonb_array_elements(to_jsonb(${ChatMessageTable.parts})) AS elem
             WHERE elem->>'type' = 'text'),
            ''
          )) @@ to_tsquery('english', ${sanitized})`,
        ),
      )
      .orderBy(desc(ChatMessageTable.createdAt))
      .limit(limit);

    return results.map((r) => {
      // Extract text from parts for snippet
      const parts = r.parts as any[];
      const textParts = (Array.isArray(parts) ? parts : [])
        .filter((p: any) => p?.type === "text")
        .map((p: any) => p.text || "");
      const fullText = textParts.join(" ");

      // Create snippet around the query match
      const lowerText = fullText.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerText.indexOf(lowerQuery);
      let snippet: string;
      if (matchIndex >= 0) {
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(fullText.length, matchIndex + query.length + 60);
        snippet =
          (start > 0 ? "..." : "") +
          fullText.slice(start, end) +
          (end < fullText.length ? "..." : "");
      } else {
        snippet = fullText.slice(0, 150) + (fullText.length > 150 ? "..." : "");
      }

      return {
        threadId: r.threadId,
        threadTitle: r.threadTitle || "Untitled",
        messageId: r.messageId,
        role: r.role,
        snippet,
        createdAt: r.createdAt,
      };
    });
  },
};
