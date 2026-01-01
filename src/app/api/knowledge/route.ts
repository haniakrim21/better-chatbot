import { getKnowledgeBases } from "@/lib/knowledge/actions";
import { getSession } from "auth/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const kbs = await getKnowledgeBases(session.user.id);
    return Response.json(kbs);
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
