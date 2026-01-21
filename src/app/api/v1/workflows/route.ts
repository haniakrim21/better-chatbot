import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { workflowRepository } from "@/lib/db/repository";
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
    // Fetch workflows
    // Assuming selectWorkflowsByUserId exists and behaves similarly to agents
    const workflows = await workflowRepository.selectWorkflowsByUserId(
      keyRecord.userId,
    );

    const formattedWorkflows = workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      version: wf.version,
      isPublished: wf.isPublished,
      visibility: wf.visibility,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    }));

    return NextResponse.json({ workflows: formattedWorkflows });
  } catch (error) {
    logger.error("API Error: /api/v1/workflows", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
