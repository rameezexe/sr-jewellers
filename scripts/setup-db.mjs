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
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
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
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");`,
  `CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");`,
  `CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");`,
];

const DROP = `DROP TABLE IF EXISTS "OrderItem","Order","ProductImage","Product","Category","AdminUser" CASCADE;
DROP TYPE IF EXISTS "OrderStatus";`;

// ── Seed data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Earrings", slug: "earrings" },
  { name: "Necklaces & Pendants", slug: "necklaces" },
  { name: "Rings", slug: "rings" },
  { name: "Bracelets & Anklets", slug: "bracelets" },
  { name: "Hair Accessories", slug: "hair" },
  { name: "Sets & Combos", slug: "sets" },
];

// A few sample products (no photos — the owner adds real photos in the admin
// panel). Delete these once real stock is added. Prices are in paise.
const PRODUCTS = [
  { name: "Pearl Drop Earrings", cat: "earrings", price: 49900, compare: 69900, stock: 12, featured: true,
    desc: "Timeless freshwater-style pearl drops that go with everything." },
  { name: "Tiny Gold Hoops", cat: "earrings", price: 39900, stock: 20, featured: true,
    desc: "Featherlight everyday hoops with a soft gold finish." },
  { name: "Layered Heart Necklace", cat: "necklaces", price: 79900, compare: 99900, stock: 8, featured: true,
    desc: "A dainty double-layer chain with a delicate heart pendant." },
  { name: "Dainty Initial Pendant", cat: "necklaces", price: 59900, stock: 15,
    desc: "Personalise your look with a delicate initial pendant." },
  { name: "Minimal Stacking Ring", cat: "rings", price: 29900, stock: 25, featured: true,
    desc: "Slim band made to stack — wear one or wear them all." },
  { name: "Crystal Flower Ring", cat: "rings", price: 44900, stock: 3,
    desc: "A sweet floral ring with sparkling cubic crystals." },
  { name: "Beaded Charm Bracelet", cat: "bracelets", price: 54900, stock: 10,
    desc: "Hand-strung beads with a tiny gold charm." },
  { name: "Butterfly Anklet", cat: "bracelets", price: 34900, stock: 0,
    desc: "Delicate anklet with a fluttering butterfly charm." },
  { name: "Pearl Hair Clip", cat: "hair", price: 24900, stock: 18, featured: true,
    desc: "Effortlessly chic pearl-studded hair clip." },
  { name: "Ribbon Scrunchie Set", cat: "hair", price: 19900, compare: 27900, stock: 30,
    desc: "Soft satin scrunchies in a set of three." },
  { name: "Everyday Essentials Set", cat: "sets", price: 129900, compare: 159900, stock: 6, featured: true,
    desc: "A curated set: hoops, a layered necklace and a stacking ring." },
];

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

  // Admin user
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

  // Categories
  const catIdBySlug = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const { rows } = await pool.query(
      `INSERT INTO "Category" ("id","name","slug","position")
       VALUES ($1,$2,$3,$4)
       ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "position" = EXCLUDED."position"
       RETURNING "id"`,
      [randomUUID(), c.name, c.slug, i],
    );
    catIdBySlug[c.slug] = rows[0].id;
  }
  console.log(`→ ${CATEGORIES.length} categories ready`);

  // Sample products
  for (const p of PRODUCTS) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await pool.query(
      `INSERT INTO "Product"
        ("id","name","slug","description","pricePaise","comparePaise","stock","isFeatured","categoryId","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, CURRENT_TIMESTAMP)
       ON CONFLICT ("slug") DO UPDATE SET
         "pricePaise" = EXCLUDED."pricePaise",
         "comparePaise" = EXCLUDED."comparePaise",
         "stock" = EXCLUDED."stock",
         "isFeatured" = EXCLUDED."isFeatured",
         "categoryId" = EXCLUDED."categoryId",
         "updatedAt" = CURRENT_TIMESTAMP`,
      [
        randomUUID(), p.name, slug, p.desc, p.price, p.compare ?? null,
        p.stock, Boolean(p.featured), catIdBySlug[p.cat],
      ],
    );
  }
  console.log(`→ ${PRODUCTS.length} sample products ready (no photos — add them in /admin)`);

  await pool.end();
  console.log("✓ Database setup complete.");
}

run().catch((err) => {
  console.error("✗ Setup failed:", err);
  process.exit(1);
});
