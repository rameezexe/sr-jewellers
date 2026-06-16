# Seoul Sparkle — Korean Jewellery Store 💕

A custom e-commerce site for selling Korean-style jewellery online: a warm,
mobile-first storefront, an admin dashboard for the shop owner, UPI + Cash on
Delivery payments (no gateway / no KYC), Cloudinary photos and order emails.

> **Rename the shop:** open `src/config/site.ts` and change `name`, `tagline`,
> contact details, social links and shipping rules. That one file drives the
> whole site.

---

## Tech stack

| Area      | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4         |
| Database  | Neon Postgres via Prisma 7 + **Neon serverless driver (HTTPS)** |
| Payments  | UPI (direct, with QR) + Cash on Delivery — no gateway         |
| Photos    | Cloudinary (signed direct uploads)                            |
| Email     | Gmail via Nodemailer (order confirmation + owner alert)       |
| Auth      | Admin email/password, signed cookie session (jose + bcrypt)   |

> ⚠️ **This machine can't reach Postgres on port 5432** (broken IPv6 route), so
> we never use `prisma migrate` / `prisma db push`. The schema is applied over
> Neon's HTTPS driver by `npm run db:setup`, and the app connects through the
> Neon driver adapter (`src/lib/prisma.ts`).

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure — copy the template and fill it in
copy .env.example .env      # (PowerShell)   or:  cp .env.example .env

# 3. Create the tables + seed the admin user (the store starts empty —
#    categories & products are added in /admin)
npm run db:setup

# 4. Run it
npm run dev                 # http://localhost:3000
```

- Storefront: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)

`npm run db:reset` drops all tables and recreates them with just the admin user
(use in dev only — it deletes orders, products and categories).

---

## Getting the API keys (all have free tiers)

### 1. Neon (database) — required
1. Create a project at <https://neon.tech>.
2. Copy the **Pooled** connection string (host ends in `-pooler…`).
3. Put it in `.env` as `DATABASE_URL` (keep `?sslmode=require`).

### 2. Payments — UPI + Cash on Delivery (no signup, no KYC)
There is **no payment gateway**. Customers either pay you directly via UPI or
choose Cash on Delivery — you confirm UPI payments yourself in /admin.
1. Set `UPI_ID` to your UPI ID/VPA (e.g. `yourname@oksbi`). The checkout shows
   this plus an auto-generated QR code.
2. Optionally set `UPI_PAYEE_NAME` (the name shown in the customer's UPI app).
3. Leave `UPI_ID` blank to offer **only** Cash on Delivery.

> All automated gateways in India (Razorpay, Cashfree, PhonePe, etc.) require
> business KYC. If you later complete KYC and want automated card payments, a
> gateway can be added on top of this — but UPI + COD needs nothing to start.

### 3. Cloudinary (product photos) — required to upload images
1. Sign up at <https://cloudinary.com>.
2. From the dashboard copy **Cloud name**, **API Key**, **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### 4. Email — Gmail (free; skipped if blank)
1. Use a Gmail account for the shop. Turn on **2-Step Verification**.
2. Create an **App Password**: Google Account → Security → 2-Step Verification →
   App passwords. Copy the 16-character password.
3. Set `GMAIL_USER` (the Gmail address) and `GMAIL_APP_PASSWORD` (the app
   password — *not* your normal password).
4. `OWNER_EMAIL` is where the "new order" alert goes (defaults to `GMAIL_USER`).

---

## Running the shop (for the owner)

Everything is managed at **/admin**:

- **Dashboard** — revenue, orders to ship, low-stock warnings.
- **Products** — add/edit pieces, set price, stock, category, upload photos,
  mark as *Featured* (shown on the home page) or hide from the shop.
- **Categories** — add/rename/hide the groups products are filed under
  (Earrings, Necklaces, …). The store ships with none — you add your own.
- **Orders** — see every order, customer + shipping details, the payment method
  and UPI reference, and update the status (Paid → Processing → Shipped →
  Delivered).
- **Settings** — change your login email and password.

**Confirming payments:** when an order is placed, stock is reserved and emails
go out. For UPI, check that the money landed in your account (match the
reference the customer entered), then set the order to **PAID**. For Cash on
Delivery, mark it **PAID** once you collect the cash. Cancelling an order
returns its items to stock.

The store starts completely empty — add your real categories and products
(with photos) from the admin panel.

---

## Going live

1. The **policy pages** at `/policies/shipping`, `/returns`, `/terms`,
   `/privacy` are already built — review and edit the wording to match your
   business.
2. Change the admin password from **/admin/settings** (or re-run `db:setup`
   with a new `ADMIN_PASSWORD`).
3. Double-check `UPI_ID` points at the account you actually want money paid
   into, and that Gmail is sending (place a test order).

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com>.
3. Add **all** the `.env` variables in *Project → Settings → Environment
   Variables* (including `NEXT_PUBLIC_SITE_URL` = your real domain).
4. Deploy. To create the tables on the production DB, run `npm run db:setup`
   locally with the production `DATABASE_URL` (it talks to Neon over HTTPS).
5. Add your domain in Vercel and set `NEXT_PUBLIC_SITE_URL` to it.

---

## Project layout

```
src/
  config/site.ts          ← shop name, contact, shipping rules (edit me!)
  lib/                    ← prisma, payments (UPI), cloudinary, email, auth, money
  components/             ← header, footer, cart, product UI, admin widgets
  app/
    (shop)/               ← storefront (home, shop, product, cart, checkout, policies)
    admin/                ← password-protected dashboard
    api/                  ← checkout (UPI/COD) + cloudinary endpoints
prisma/schema.prisma      ← data model
scripts/setup-db.mjs      ← applies schema + seeds over Neon HTTPS
```
