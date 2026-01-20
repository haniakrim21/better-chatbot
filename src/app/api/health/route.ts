import { NextResponse } from "next/server";
import { pgDb } from "lib/db/pg/db.pg";
import { sql } from "drizzle-orm";

// Force dynamic behavior so it's not cached at build time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Basic connectivity check
    // We try a simple query to ensure DB is responsive
    await pgDb.execute(sql`SELECT 1`);

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
