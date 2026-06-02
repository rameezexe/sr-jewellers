import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config. The app connects through the Neon driver adapter in
 * src/lib/prisma.ts using DATABASE_URL at runtime. We never run
 * `prisma migrate`/`db push` (port 5432 is broken on this machine) — the schema
 * is applied via `npm run db:setup` over Neon's HTTPS driver — so the CLI only
 * needs to know where the schema lives.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
});
