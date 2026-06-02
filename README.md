# Seoul Sparkle — Korean Jewellery Store 💕

A custom e-commerce site for selling Korean-style jewellery online: a warm,
mobile-first storefront, an admin dashboard for the shop owner, Razorpay
payments (UPI + cards), Cloudinary photos and order emails.

> **Rename the shop:** open `src/config/site.ts` and change `name`, `tagline`,
> contact details, social links and shipping rules. That one file drives the
> whole site.

---

## Tech stack

| Area      | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4         |
| Database  | Neon Postgres via Prisma 7 + **Neon serverless driver (HTTPS)** |
| Payments  | Razorpay (Cards, UPI, netbanking, wallets)                    |
| Photos    | Cloudinary (signed direct uploads)                            |
| Email     | Resend (order confirmation + owner alert)                     |
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

# 3. Create the tables + seed sample data (admin user, categories, products)
npm run db:setup

# 4. Run it
npm run dev                 # http://localhost:3000
```

- Storefront: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)

`npm run db:reset` wipes all tables and re-seeds (use in dev only — it deletes orders).

---

## Getting the API keys (all have free tiers)

### 1. Neon (database) — required
1. Create a project at <https://neon.tech>.
2. Copy the **Pooled** connection string (host ends in `-pooler…`).
3. Put it in `.env` as `DATABASE_URL` (keep `?sslmode=require`).

### 2. Razorpay (payments) — required for checkout
1. Sign up at <https://dashboard.razorpay.com>.
2. In **Test Mode**, go to *Settings → API Keys* and generate keys.
3. Set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` in `.env`.
4. **Webhook** (recommended): *Settings → Webhooks → Add* →
   - URL: `https://YOUR_DOMAIN/api/razorpay/webhook`
   - Events: `payment.captured`, `order.paid`
   - Set a secret and copy it into `RAZORPAY_WEBHOOK_SECRET`.

### 3. Cloudinary (product photos) — required to upload images
1. Sign up at <https://cloudinary.com>.
2. From the dashboard copy **Cloud name**, **API Key**, **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### 4. Resend (emails) — optional (skipped if blank)
1. Sign up at <https://resend.com>, create an API key.
2. Set `RESEND_API_KEY`. For testing, `EMAIL_FROM="…<onboarding@resend.dev>"`
   works; for production, verify your domain and use an address on it.
3. `OWNER_EMAIL` is where the "new order" alert goes (the shop owner).

---

## Running the shop (for the owner)

Everything is managed at **/admin**:

- **Dashboard** — revenue, orders to ship, low-stock warnings.
- **Products** — add/edit pieces, set price, stock, category, upload photos,
  mark as *Featured* (shown on the home page) or hide from the shop.
- **Orders** — see every order, customer + shipping details, and update the
  status (Paid → Processing → Shipped → Delivered).

When a customer pays, the order is confirmed automatically, stock is reduced,
and emails go out to the customer and the owner.

The seeded sample products have **no photos** — delete them and add your real
stock with photos from the admin panel.

---

## Going live (real payments)

1. Complete **Razorpay KYC** (business + bank details). This unlocks Live Mode.
2. Swap the `RAZORPAY_KEY_ID`/`SECRET` in production for the **Live** keys
   (`rzp_live_…`) and add a **Live** webhook.
3. Razorpay reviews your site — the **policy pages** at `/policies/shipping`,
   `/returns`, `/terms`, `/privacy` are already built. Review and edit the
   wording to match your business.
4. Change the admin password (re-run `db:setup` with a new `ADMIN_PASSWORD`,
   or update it in the database).

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com>.
3. Add **all** the `.env` variables in *Project → Settings → Environment
   Variables* (including `NEXT_PUBLIC_SITE_URL` = your real domain).
4. Deploy. To create the tables on the production DB, run `npm run db:setup`
   locally with the production `DATABASE_URL` (it talks to Neon over HTTPS).
5. Add your domain and update the Razorpay webhook URL to it.

---

## Project layout

```
src/
  config/site.ts          ← shop name, contact, shipping rules (edit me!)
  lib/                    ← prisma, razorpay, cloudinary, email, auth, money
  components/             ← header, footer, cart, product UI, admin widgets
  app/
    (shop)/               ← storefront (home, shop, product, cart, checkout, policies)
    admin/                ← password-protected dashboard
    api/                  ← razorpay + cloudinary endpoints
prisma/schema.prisma      ← data model
scripts/setup-db.mjs      ← applies schema + seeds over Neon HTTPS
```
