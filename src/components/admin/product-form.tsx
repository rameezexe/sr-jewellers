import { paiseToRupees } from "@/lib/money";

type Category = { id: string; name: string };

type ProductDefaults = {
  name: string;
  slug: string;
  description: string;
  details: string;
  pricePaise: number;
  comparePaise: number | null;
  stock: number;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
};

const input =
  "w-full rounded-lg border border-blush-deep bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";
const labelText = "mb-1 block text-sm font-medium text-ink";

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  product?: ProductDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <label className="block">
        <span className={labelText}>Name *</span>
        <input name="name" required defaultValue={product?.name} className={input} />
      </label>

      <label className="block">
        <span className={labelText}>URL slug</span>
        <input
          name="slug"
          defaultValue={product?.slug}
          placeholder="Leave blank to auto-generate from name"
          className={input}
        />
      </label>

      <label className="block">
        <span className={labelText}>Category</span>
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={input}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelText}>Price (₹) *</span>
          <input
            name="priceRupees"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product ? paiseToRupees(product.pricePaise) : ""}
            className={input}
          />
        </label>
        <label className="block">
          <span className={labelText}>Compare-at (₹)</span>
          <input
            name="compareRupees"
            type="number"
            min="0"
            step="1"
            placeholder="optional"
            defaultValue={
              product?.comparePaise ? paiseToRupees(product.comparePaise) : ""
            }
            className={input}
          />
        </label>
        <label className="block">
          <span className={labelText}>Stock *</span>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
            className={input}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelText}>Short description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={product?.description}
          placeholder="A line or two shown on the product page"
          className={input}
        />
      </label>

      <label className="block">
        <span className={labelText}>Details &amp; care</span>
        <textarea
          name="details"
          rows={4}
          defaultValue={product?.details}
          placeholder="Material, size, how to care for it…"
          className={input}
        />
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product ? product.isActive : true}
            className="h-4 w-4 accent-brand"
          />
          Visible in shop
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            className="h-4 w-4 accent-brand"
          />
          Featured on home
        </label>
      </div>

      <button
        type="submit"
        className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
}
