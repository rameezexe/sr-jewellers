import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { formatPaise } from "@/lib/money";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description || undefined,
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const onSale =
    product.comparePaise != null && product.comparePaise > product.pricePaise;
  const discount = onSale
    ? Math.round(
        ((product.comparePaise! - product.pricePaise) / product.comparePaise!) *
          100,
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-brand">
          Shop
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-brand"
            >
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          name={product.name}
        />

        <div className="lg:py-4">
          {product.category && (
            <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl text-brand-dark">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold text-ink">
              {formatPaise(product.pricePaise)}
            </span>
            {onSale && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPaise(product.comparePaise!)}
                </span>
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="mt-2 text-sm text-brand">
              Only {product.stock} left — order soon!
            </p>
          )}

          {product.description && (
            <p className="mt-5 leading-relaxed text-ink/80">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <AddToCart
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                pricePaise: product.pricePaise,
                imageUrl: product.images[0]?.url ?? "",
                stock: product.stock,
              }}
            />
          </div>

          {product.details && (
            <div className="mt-8 border-t border-blush-deep/60 pt-6">
              <h2 className="font-display text-xl text-ink">Details &amp; care</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                {product.details}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-1 text-sm text-muted">
            <p>✦ Free shipping on orders over ₹999</p>
            <p>✦ Carefully packed &amp; shipped across India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
