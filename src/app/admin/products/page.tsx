import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 1, orderBy: { position: "asc" } },
      category: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-brand-dark">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add product
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-blush-deep/60 bg-white">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">
            No products yet. Add your first piece!
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-blush/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-center">Stock</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-blush-deep/40 hover:bg-blush/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-blush">
                        {p.images[0] && (
                          <Image
                            src={p.images[0].url}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.isFeatured && <span title="Featured">⭐</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-ink">
                    {formatPaise(p.pricePaise)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={p.stock <= 3 ? "font-semibold text-brand" : "text-ink"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.isActive ? (
                      <span className="text-green-600">Live</span>
                    ) : (
                      <span className="text-muted">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-sm text-brand hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
