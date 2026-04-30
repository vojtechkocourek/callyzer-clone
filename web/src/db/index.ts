import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV === "production") {
  console.warn("[db] DATABASE_URL is not set; runtime queries will fail.");
}

const client =
  global.__pgClient ??
  (url
    ? postgres(url, {
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      })
    : (undefined as unknown as ReturnType<typeof postgres>));

if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = client ? drizzle(client, { schema }) : (null as never);

export function requireDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in your environment (e.g. Vercel Project Settings -> Environment Variables).",
    );
  }
  return db;
}

export { schema };
