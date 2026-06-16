// ─────────────────────────────────────────────────────────────────────────
//  Database setup + seed, run over Neon's serverless driver (HTTPS/WebSocket,
//  port 443). We do this instead of `prisma migrate`/`db push` because direct
//  Postgres over 5432 is broken on this machine.
//
//  Usage:
//    npm run db:setup      # create tables (idempotent) + seed
//    npm run db:reset      # DROP everything first, then recreate + seed
//
//  The DDL below mirrors Prisma's Postgres conventions exactly (quoted
//  PascalCase table names, camelCase columns, TIMESTAMP(3), an "OrderStatus"
//  enum) so the generated Prisma Client queries it correctly.
// ─────────────────────────────────────────────────────────────────────────
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

neonConfig.webSocketConstructor = ws;

const RESET = process.argv.includes("--reset");

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL is not set. Add it to .env (Neon pooled URL).");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ENUM = `DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;`;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "pricePaise" INTEGER NOT NULL,
    "comparePaise" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId")
      REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "ProductImage" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL DEFAULT '',
    "alt" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId")
      REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "subtotalPaise" INTEGER NOT NULL,
    "shippingPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "paymentRef" TEXT NOT NULL DEFAULT '',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId")
      REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId")
      REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");`,
  `CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");`,
  `CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");`,
  `CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");`,
  `CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");`,
];

// Idempotent column migrations so an already-created database picks up the
// switch from Razorpay to UPI/COD without needing a full reset.
const MIGRATIONS = [
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'UPI';`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT NOT NULL DEFAULT '';`,
  `ALTER TABLE "Order" DROP COLUMN IF EXISTS "razorpayOrderId";`,
  `ALTER TABLE "Order" DROP COLUMN IF EXISTS "razorpayPaymentId";`,
];

const DROP = `DROP TABLE IF EXISTS "OrderItem","Order","ProductImage","Product","Category","AdminUser" CASCADE;
DROP TYPE IF EXISTS "OrderStatus";`;

async function run() {
  console.log(`→ Connecting to Neon over HTTPS… (${RESET ? "RESET mode" : "setup"})`);

  if (RESET) {
    console.log("→ Dropping existing tables…");
    await pool.query(DROP);
  }

  console.log("→ Creating enum + tables + indexes…");
  await pool.query(ENUM);
  for (const sql of TABLES) await pool.query(sql);
  for (const sql of INDEXES) await pool.query(sql);
  for (const sql of MIGRATIONS) await pool.query(sql);

  // Admin user — the only thing we seed. Categories and products are added by
  // the shop owner in /admin, so the store starts completely empty.
  const email = process.env.ADMIN_EMAIL || "mom@example.com";
  const password = process.env.ADMIN_PASSWORD || "change-this-now";
  const name = process.env.ADMIN_NAME || "Shop Owner";
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO "AdminUser" ("id","email","passwordHash","name")
     VALUES ($1,$2,$3,$4)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "name" = EXCLUDED."name"`,
    [randomUUID(), email, hash, name],
  );
  console.log(`→ Admin user ready: ${email}`);

  await pool.end();
  console.log("✓ Database setup complete. Add categories & products in /admin.");
}

run().catch((err) => {
  console.error("✗ Setup failed:", err);
  process.exit(1);
});
