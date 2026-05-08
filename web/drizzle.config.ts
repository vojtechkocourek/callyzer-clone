import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// drizzle-kit doesn't auto-load env files like Next.js does. Match Next.js
// precedence — .env.local overrides .env — so `npm run db:push` picks up the
// same DATABASE_URL the dev server uses.
loadEnv({ path: ".env.local" });
loadEnv();

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
