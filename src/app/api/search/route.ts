import { getSession } from "auth/server";
import { searchRepository } from "lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "20",
      10,
    );

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const results = await searchRepository.search(
      session.user.id,
      query,
      Math.min(limit, 50),
    );

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 },
    );
  }
}
