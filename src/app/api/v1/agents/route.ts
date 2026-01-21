import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { agentRepository } from "@/lib/db/repository";
import logger from "logger";

export async function GET(req: NextRequest) {
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

  try {
    // Fetch agents accessible to the user
    const agents = await agentRepository.selectAgents(keyRecord.userId, [
      "all",
    ]);

    // Format for external API consumption
    const formattedAgents = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      tags: agent.tags,
      usageCount: agent.usageCount,
      visibility: agent.visibility,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));

    return NextResponse.json({ agents: formattedAgents });
  } catch (error) {
    logger.error("API Error: /api/v1/agents", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
