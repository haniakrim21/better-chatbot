import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { chatService } from "@/lib/services/chat-service";
import { userRepository } from "@/lib/db/repository";
import logger from "logger";

export async function POST(req: NextRequest) {
  const apiKeyHeader =
    req.headers.get("Authorization")?.replace("Bearer ", "") ||
    req.headers.get("X-API-Key");

  if (!apiKeyHeader) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const keyRecord = await validateApiKey(apiKeyHeader);
  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401 },
    );
  }

  const user = await userRepository.getUserById(keyRecord.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    // Map OpenAI model to internal model if necessary
    const internalModel = model || "gpt-4o";

    // Call chat service
    const result = await chatService.processRequest(
      {
        user: user as any,
        session: { userId: user.id } as any,
      },
      {
        id: body.threadId || "",
        message: {
          id: "", // Let chat service generate or take from body
          role: "user", // Usually the last message in a completion request is user
          parts: messages.at(-1)?.parts || [
            { type: "text", text: messages.at(-1)?.content || "" },
          ],
        },
        chatModel: {
          provider: internalModel.includes("gpt") ? "openai" : "google", // Simplistic mapping
          modelId: internalModel,
        },
        // Spread other relevant fields if available
        ...body,
      },
      req.signal,
    );

    return result;
  } catch (error) {
    logger.error("API Error: /api/v1/chat/completions", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
