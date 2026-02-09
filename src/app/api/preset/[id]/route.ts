import { getSession } from "auth/server";
import { presetRepository } from "lib/db/repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const existingPreset = await presetRepository.getPresetById(id);

    if (!existingPreset) {
      return Response.json({ error: "Preset not found" }, { status: 404 });
    }

    if (existingPreset.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    await presetRepository.deletePreset(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete preset:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
