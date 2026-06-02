import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Prisma client wired to Neon's serverless driver over HTTPS/WebSocket (port 443).
 *
 * Why: on this machine direct Postgres over 5432 fails (broken IPv6 route), so
 * the runtime MUST go through Neon's driver adapter. Node 22+ ships a global
 * WebSocket, which @neondatabase/serverless uses automatically — no `ws` shim
 * needed here.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — see .env.example");
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
