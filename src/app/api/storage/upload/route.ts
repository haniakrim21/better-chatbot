import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { serverFileStorage, storageDriver } from "lib/file-storage";
import { checkStorageAction } from "../actions";

export async function POST(request: Request) {
  console.log("Upload API request received. URL:", request.url);
  const session = await getSession();
  console.log("Upload API. Session ID:", session?.user?.id);

  if (!session?.user?.id) {
    console.log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check storage configuration first
  const storageCheck = await checkStorageAction();
  console.log("Storage check:", storageCheck);
  if (!storageCheck.isValid) {
    return NextResponse.json(
      {
        error: storageCheck.error,
        solution: storageCheck.solution,
        storageDriver,
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use 'file' field in FormData." },
        { status: 400 },
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage (works with any storage backend)
    const result = await serverFileStorage.upload(buffer, {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    console.log("Upload result:", result);

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.sourceUrl,
      metadata: result.metadata,
    });
  } catch (error: any) {
    if (error.code === "ECONNRESET" || error.message?.includes("aborted")) {
      console.warn("Upload aborted by client");
      return NextResponse.json(
        { error: "Upload aborted" },
        { status: 499 }, // Client Closed Request
      );
    }
    console.error("Failed to upload file", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
