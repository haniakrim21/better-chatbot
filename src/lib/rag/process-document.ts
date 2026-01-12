export async function parsePDF(buffer: Buffer): Promise<string> {
  // @ts-ignore
  const pdfParse = (await import("pdf-parse")).default;
  const pdf = (pdfParse as any).default || pdfParse;
  const data = await pdf(buffer);
  return data.text;
}

export function chunkText(
  text: string,
  maxLength: number = 1000,
  overlap: number = 200,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxLength, text.length);
    let chunk = text.slice(start, end);

    // If we're not at the end of the text, try to break at a newline or space
    if (end < text.length) {
      const lastNewline = chunk.lastIndexOf("\n");
      const lastSpace = chunk.lastIndexOf(" ");

      if (lastNewline > maxLength * 0.8) {
        chunk = chunk.slice(0, lastNewline + 1);
        start += lastNewline + 1;
      } else if (lastSpace > maxLength * 0.8) {
        chunk = chunk.slice(0, lastSpace + 1);
        start += lastSpace + 1;
      } else {
        start += maxLength; // Hard break if no good split point
      }
    } else {
      start += maxLength;
    }

    chunks.push(chunk.trim());

    // Move back for overlap, but don't go past the start of the next expected chunk if we did a custom break
    if (start < text.length) {
      start = Math.max(start - overlap, 0);
    }
  }

  return chunks.filter((c) => c.length > 0);
}
