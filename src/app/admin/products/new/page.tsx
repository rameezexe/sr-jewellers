import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-brand">
        ← Back to products
      </Link>
      <h1 className="mt-2 font-display text-3xl text-brand-dark">Add product</h1>
      <p className="mt-1 text-sm text-muted">
        Save the basics first — you&apos;ll add photos on the next screen.
      </p>
      <div className="mt-6">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Save & add photos"
        />
      </div>
    </div>
  );
}
