import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // Migration is now handled by Dockerfile CMD (tsx scripts/db-migrate.ts)
      // Commenting this out to avoid pg module resolution issues in standalone build
      // const runMigrate = await import("./lib/db/pg/migrate.pg").then(
      //   (m) => m.runMigrate,
      // );
      // await runMigrate().catch((e) => {
      //   console.error(e);
      //   process.exit(1);
      // });
      // const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
      //   (m) => m.initMCPManager,
      // );
      // await initMCPManager();
    }
  }
}
