import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/queries";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { updateProductAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    getCategories(),
  ]);
  if (!product) notFound();

  // Bind the product id into the update action.
  const action = updateProductAction.bind(null, product.id);

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-brand">
        ← Back to products
      </Link>
      <h1 className="mt-2 font-display text-3xl text-brand-dark">Edit product</h1>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductForm
          action={action}
          categories={categories}
          submitLabel="Save changes"
          product={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            details: product.details,
            pricePaise: product.pricePaise,
            comparePaise: product.comparePaise,
            stock: product.stock,
            categoryId: product.categoryId,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
          }}
        />

        <div>
          <h2 className="font-display text-xl text-ink">Photos</h2>
          <p className="mb-3 text-sm text-muted">
            Upload product photos. They&apos;re stored on Cloudinary.
          </p>
          <ImageManager
            productId={product.id}
            images={product.images.map((i) => ({
              id: i.id,
              url: i.url,
              alt: i.alt,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
