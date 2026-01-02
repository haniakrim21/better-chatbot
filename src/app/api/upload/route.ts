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
    const parentId = (formData.get("parentId") as string) || null;

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
        parentId,
        status: "processing",
      })
      .returning();

    // Process in background (but await for V1 simplicity or use waitUntil)
    // For now, let's await to ensure it works before optimizing response time
    try {
      console.log("Starting document processing for:", doc.id);
      let text = "";
      if (type === "application/pdf") {
        console.log("Parsing PDF...");
        text = await parsePDF(buffer);
      } else {
        console.log("Reading text file...");
        text = buffer.toString("utf-8"); // Fallback for txt/md
      }
      console.log("Text extracted, length:", text.length);

      const chunks = chunkText(text);
      console.log("Generated chunks:", chunks.length);

      const embeddings = await generateEmbeddings(chunks);
      console.log("Generated embeddings:", embeddings.length);

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
      console.log("Chunks inserted");

      await db
        .update(DocumentTable)
        .set({ status: "completed" })
        .where(eq(DocumentTable.id, doc.id));

      return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
      console.error("Processing error details:", error);
      await db
        .update(DocumentTable)
        .set({ status: "error", error: error.message })
        .where(eq(DocumentTable.id, doc.id));
      return NextResponse.json(
        {
          error: "Processing failed",
          details: error.message,
          stack: error.stack,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Upload route fatal error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
