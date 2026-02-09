import { PresetCreateSchema } from "app-types/preset";
import { getSession } from "auth/server";
import { presetRepository } from "lib/db/repository";
import { z } from "zod";

export async function GET() {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const presets = await presetRepository.getPresetsByUserId(session.user.id);
    return Response.json(presets);
  } catch (error) {
    console.error("Failed to fetch presets:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const data = PresetCreateSchema.parse(body);

    const preset = await presetRepository.createPreset({
      name: data.name,
      allowedMcpServers: data.allowedMcpServers ?? undefined,
      allowedAppDefaultToolkit: data.allowedAppDefaultToolkit ?? undefined,
      userId: session.user.id,
    });

    return Response.json(preset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Failed to create preset:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
