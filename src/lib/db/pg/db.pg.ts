import { Pool } from "pg";
import {
  drizzle as drizzlePg,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";

import * as schema from "./schema.pg";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

let _pgDb: NodePgDatabase<typeof schema> | null = null;

function initPgDb(): NodePgDatabase<typeof schema> {
  if (!process.env.POSTGRES_URL) {
    throw new Error(
      "POSTGRES_URL environment variable is not set. Please configure it in your environment.",
    );
  }
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
  return drizzlePg(pool, {
    schema,
    //   logger: new MyLogger(),
  });
}

export const getPgDb = (): NodePgDatabase<typeof schema> => {
  if (!_pgDb) {
    _pgDb = initPgDb();
  }
  return _pgDb;
};

// For backward compatibility - use a getter function that returns the db instance
export const pgDb: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_, prop) {
      const db = getPgDb();
      const value = db[prop as keyof typeof db];
      return typeof value === "function" ? value.bind(db) : value;
    },
  },
);
