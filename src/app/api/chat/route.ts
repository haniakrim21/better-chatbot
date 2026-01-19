import { chatApiSchemaRequestBodySchema } from "app-types/chat";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import globalLogger from "logger";
import { chatService } from "lib/services/chat-service";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log("[Chat API] Request received:", JSON.stringify(json, null, 2));

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = chatApiSchemaRequestBodySchema.parse(json);

    return chatService.processRequest(session, body, request.signal);
  } catch (error: any) {
    if (error.message === "Forbidden") {
      return new Response("Forbidden", { status: 403 });
    }
    logger.error(error);
    console.error("[Chat API Error]", error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
