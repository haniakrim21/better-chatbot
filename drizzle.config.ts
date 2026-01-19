import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const dialect = "postgresql";

const url = process.env.POSTGRES_URL!;

const schema = "./src/lib/db/pg/schema.pg.ts";

const out = "./src/lib/db/migrations/pg";

export default defineConfig({
  schema,
  out,
  dialect,
  migrations: {},
  dbCredentials: {
    url,
  },
});
