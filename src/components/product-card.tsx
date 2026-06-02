import Link from "next/link";
import Image from "next/image";
import { formatPaise } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const image = product.images[0];
  const onSale =
    product.comparePaise != null && product.comparePaise > product.pricePaise;
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block animate-fade-up"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo yet
          </div>
        )}
        {onSale && !soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
            Sale
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-display text-lg leading-tight text-ink group-hover:text-brand">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-dark">
            {formatPaise(product.pricePaise)}
          </span>
          {onSale && (
            <span className="text-xs text-muted line-through">
              {formatPaise(product.comparePaise!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
