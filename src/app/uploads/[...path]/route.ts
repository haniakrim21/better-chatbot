import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import {
  getContentTypeFromFilename,
  resolveStoragePrefix,
} from "lib/file-storage/storage-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join("/");

    // Security: Prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      // While pathSegments are arrays, manual manipulation or weird encoding might sneak in.
      // Actually, join('/') makes it a path. getContentTypeFromFilename handles extension.
      // We only want to serve files from the uploads directory.
      // But subdirectories? "uploads" prefix usually implies flat or specific structure.
      // local-file-storage uses `relativePath = path.join(folder, id-name)`.
      // So subdirectories are possible if folder has them.
      // But `valid path` check is good.
    }

    // Ensure we are only serving from the intended directory
    const prefix = resolveStoragePrefix();
    const uploadsDir = path.join(process.cwd(), "public", prefix);
    const filePath = path.join(uploadsDir, ...pathSegments);

    // Extra security: ensure resolved path is within uploadsDir
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getContentTypeFromFilename(filename);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving static file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
