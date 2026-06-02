import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug: category }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="text-center">
        <h1 className="font-display text-4xl text-brand-dark">
          {activeCategory ? activeCategory.name : "All jewellery"}
        </h1>
        <p className="mt-2 text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </header>

      {/* Category filter pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <FilterPill href="/shop" active={!category} label="All" />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            href={`/shop?category=${c.slug}`}
            active={category === c.slug}
            label={c.name}
          />
        ))}
      </div>

      <div className="gold-rule my-8" />

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted">
          Nothing here yet — new pieces coming soon! ✨
        </p>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand text-white"
          : "border border-blush-deep text-ink hover:bg-blush"
      }`}
    >
      {label}
    </Link>
  );
}
