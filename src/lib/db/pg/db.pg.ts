// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

import * as schema from "./schema.pg";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

let _pgDb: ReturnType<typeof drizzlePg> | null = null;

export const getPgDb = () => {
  if (!_pgDb) {
    if (!process.env.POSTGRES_URL) {
      throw new Error(
        "POSTGRES_URL environment variable is not set. Please configure it in your environment.",
      );
    }
    _pgDb = drizzlePg(process.env.POSTGRES_URL, {
      schema,
      //   logger: new MyLogger(),
    });
  }
  return _pgDb;
};

// For backward compatibility, export a getter
export const pgDb = new Proxy({} as ReturnType<typeof drizzlePg>, {
  get(target, prop) {
    return getPgDb()[prop as keyof ReturnType<typeof drizzlePg>];
  },
});
