import { NextRequest, NextResponse } from "next/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { DocumentTable, DocumentChunkTable } from "@/lib/db/pg/schema.pg";
import { parsePDF, chunkText } from "@/lib/rag/process-document";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string;

    if (!file || !knowledgeBaseId) {
      return NextResponse.json(
        { error: "File and Knowledge Base ID are required" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const size = buffer.length;
    const type = file.type;
    const name = file.name;

    // Create Document entry
    const [doc] = await db
      .insert(DocumentTable)
      .values({
        knowledgeBaseId,
        name,
        size,
        type,
        status: "processing",
      })
      .returning();

    // Process in background (but await for V1 simplicity or use waitUntil)
    // For now, let's await to ensure it works before optimizing response time
    try {
      let text = "";
      if (type === "application/pdf") {
        text = await parsePDF(buffer);
      } else {
        text = buffer.toString("utf-8"); // Fallback for txt/md
      }

      const chunks = chunkText(text);
      const embeddings = await generateEmbeddings(chunks);

      const chunkRecords = chunks.map((content, i) => ({
        documentId: doc.id,
        content,
        embedding: embeddings[i],
        metadata: { index: i },
      }));

      // Batch insert chunks
      // Drizzle batch insert
      if (chunkRecords.length > 0) {
        await db.insert(DocumentChunkTable).values(chunkRecords);
      }

      await db
        .update(DocumentTable)
        .set({ status: "completed" })
        .where(eq(DocumentTable.id, doc.id));

      return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
      console.error("Processing error:", error);
      await db
        .update(DocumentTable)
        .set({ status: "error", error: error.message })
        .where(eq(DocumentTable.id, doc.id));
      return NextResponse.json(
        { error: "Processing failed", details: error.message },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message },
      { status: 500 },
    );
  }
}
