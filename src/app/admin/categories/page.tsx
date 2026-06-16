import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategoryAction, updateCategoryAction } from "@/app/admin/actions";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

export const dynamic = "force-dynamic";

const input =
  "rounded-lg border border-blush-deep bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Group your jewellery (e.g. Earrings, Necklaces). Customers can filter the
        shop by these. Deleting a category never deletes its products.
      </p>

      {/* Add a category */}
      <form
        action={createCategoryAction}
        className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-blush-deep/60 bg-white p-4"
      >
        <input
          name="name"
          required
          placeholder="New category name"
          className={`${input} flex-1 min-w-[180px]`}
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add category
        </button>
      </form>

      {/* Existing categories */}
      <div className="mt-6 overflow-hidden rounded-xl border border-blush-deep/60 bg-white">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">
            No categories yet. Add your first one above.
          </p>
        ) : (
          <>
            <div className="hidden gap-3 bg-blush/50 px-4 py-2 text-xs uppercase tracking-wide text-muted sm:flex">
              <span className="flex-1">Name</span>
              <span className="w-40">Slug (URL)</span>
              <span className="w-20 text-center">Products</span>
              <span className="w-20 text-center">Visible</span>
              <span className="w-28" />
            </div>
            {categories.map((c) => (
              <form
                key={c.id}
                action={updateCategoryAction.bind(null, c.id)}
                className="flex flex-wrap items-center gap-3 border-t border-blush-deep/40 px-4 py-3"
              >
                <input
                  name="name"
                  defaultValue={c.name}
                  required
                  className={`${input} flex-1 min-w-[140px]`}
                />
                <input
                  name="slug"
                  defaultValue={c.slug}
                  className={`${input} w-40`}
                />
                <span className="w-20 text-center text-sm text-muted">
                  {c._count.products}
                </span>
                <label className="flex w-20 items-center justify-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={c.isActive}
                    className="h-4 w-4 accent-brand"
                  />
                </label>
                <div className="flex w-28 items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                  >
                    Save
                  </button>
                  <DeleteCategoryButton
                    id={c.id}
                    name={c.name}
                    count={c._count.products}
                  />
                </div>
              </form>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
