import Link from "next/link";
import { getFeaturedProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { SITE } from "@/config/site";

// Always reflect the latest products/categories the owner has set.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blush via-cream to-cream" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold-dark">
            Korean-inspired jewellery
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight text-brand-dark sm:text-6xl">
            {SITE.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            {SITE.tagline}. Delicate, everyday pieces — hand-picked and shipped
            to your door across India.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
            >
              Shop the collection
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-brand px-8 py-3 text-sm font-semibold text-brand transition-colors hover:bg-blush"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-center font-display text-3xl text-ink">
            Shop by category
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="group flex aspect-square flex-col items-center justify-center rounded-2xl bg-blush text-center transition-colors hover:bg-blush-deep"
              >
                <span className="px-2 font-display text-lg leading-tight text-ink group-hover:text-brand-dark">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-ink">New &amp; loved</h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            View all →
          </Link>
        </div>
        <div className="gold-rule my-6" />
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted">
            New pieces are on their way — check back soon! ✨
          </p>
        )}
      </section>

      {/* Brand strip */}
      <section className="mx-auto my-12 max-w-4xl px-6 text-center">
        <div className="rounded-3xl bg-blush/60 px-8 py-12">
          <h2 className="font-display text-3xl text-brand-dark">
            Made to feel special, every day
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Each piece is chosen with care for quality and that effortless
            Korean aesthetic. Follow along on Instagram for new drops and
            styling.
          </p>
          {SITE.instagram && (
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-brand px-8 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              Follow us on Instagram
            </a>
          )}
        </div>
      </section>
    </>
  );
}
