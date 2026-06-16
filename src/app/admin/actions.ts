"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  hashPassword,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import { rupeesToPaise } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { deleteImage } from "@/lib/cloudinary";
import { applyStatusChange } from "@/lib/orders";
import { updateShippingSettings } from "@/lib/settings";

// ── Auth ─────────────────────────────────────────────────────────────────
export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession({ adminId: admin.id, email: admin.email });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// ── Products ───────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional().default(""),
  details: z.string().trim().optional().default(""),
  priceRupees: z.coerce.number().nonnegative("Price must be 0 or more"),
  compareRupees: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

/** Build a slug that isn't already taken (optionally ignoring one product id). */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "item";
  let slug = root;
  let n = 1;
  // Loop until we find a free slug.
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

function parseProductForm(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") ?? "",
    details: formData.get("details") ?? "",
    priceRupees: formData.get("priceRupees"),
    compareRupees: formData.get("compareRupees") || undefined,
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId") || undefined,
    // checkboxes are present ("on") only when ticked
    isActive: formData.get("isActive") != null,
    isFeatured: formData.get("isFeatured") != null,
  });
  return parsed;
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data.");
  }
  const d = parsed.data;
  const slug = await uniqueSlug(d.slug || d.name);

  const product = await prisma.product.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      details: d.details,
      pricePaise: rupeesToPaise(d.priceRupees),
      comparePaise:
        d.compareRupees && d.compareRupees > 0
          ? rupeesToPaise(d.compareRupees)
          : null,
      stock: d.stock,
      categoryId: d.categoryId || null,
      isActive: d.isActive,
      isFeatured: d.isFeatured,
    },
  });

  revalidatePath("/admin/products");
  // Continue to the edit page so the owner can add photos.
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data.");
  }
  const d = parsed.data;
  const slug = await uniqueSlug(d.slug || d.name, productId);

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: d.name,
      slug,
      description: d.description,
      details: d.details,
      pricePaise: rupeesToPaise(d.priceRupees),
      comparePaise:
        d.compareRupees && d.compareRupees > 0
          ? rupeesToPaise(d.compareRupees)
          : null,
      stock: d.stock,
      categoryId: d.categoryId || null,
      isActive: d.isActive,
      isFeatured: d.isFeatured,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const images = await prisma.productImage.findMany({
    where: { productId },
    select: { publicId: true },
  });
  await prisma.product.delete({ where: { id: productId } });
  // Best-effort cleanup of Cloudinary assets.
  await Promise.all(images.map((i) => deleteImage(i.publicId)));
  revalidatePath("/admin/products");
}

// ── Product images ──────────────────────────────────────────────────────────
export async function addProductImageAction(input: {
  productId: string;
  url: string;
  publicId: string;
  alt?: string;
}) {
  await requireAdmin();
  const count = await prisma.productImage.count({
    where: { productId: input.productId },
  });
  await prisma.productImage.create({
    data: {
      productId: input.productId,
      url: input.url,
      publicId: input.publicId,
      alt: input.alt ?? "",
      position: count,
    },
  });
  revalidatePath(`/admin/products/${input.productId}/edit`);
}

export async function deleteProductImageAction(imageId: string) {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteImage(image.publicId);
  revalidatePath(`/admin/products/${image.productId}/edit`);
}

// ── Orders ───────────────────────────────────────────────────────────────────
const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export async function updateOrderStatusAction(orderId: string, status: string) {
  await requireAdmin();
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Invalid status.");
  }
  // Keeps stock + paidAt consistent (returns/re-reserves items on cancel).
  await applyStatusChange(orderId, status as (typeof STATUSES)[number]);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// ── Categories ─────────────────────────────────────────────────────────────
/** Build a category slug that isn't already taken (optionally ignoring one id). */
async function uniqueCategorySlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "category";
  let slug = root;
  let n = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  const slug = await uniqueCategorySlug(name);
  const max = await prisma.category.aggregate({ _max: { position: true } });
  await prisma.category.create({
    data: { name, slug, position: (max._max.position ?? -1) + 1 },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw new Error("Category not found.");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput
    ? await uniqueCategorySlug(slugInput, categoryId)
    : existing.slug;
  const isActive = formData.get("isActive") != null;

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, slug, isActive },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();
  // Products keep existing — their categoryId is set null by the FK rule.
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

// ── Account settings ───────────────────────────────────────────────────────
export type AccountState = { error?: string; success?: string };

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function updateAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailRe.test(email)) return { error: "Enter a valid email address." };

  const clash = await prisma.adminUser.findUnique({ where: { email } });
  if (clash && clash.id !== session.adminId) {
    return { error: "That email is already in use." };
  }

  await prisma.adminUser.update({
    where: { id: session.adminId },
    data: { name, email },
  });
  // Refresh the session cookie so it carries the new email.
  await createSession({ adminId: session.adminId, email });
  revalidatePath("/admin/settings");
  return { success: "Account details saved." };
}

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const session = await requireAdmin();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) return { error: "New passwords don't match." };

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
  });
  if (!admin || !(await verifyPassword(current, admin.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }

  await prisma.adminUser.update({
    where: { id: session.adminId },
    data: { passwordHash: await hashPassword(next) },
  });
  return { success: "Password changed." };
}

// ── Shipping settings ──────────────────────────────────────────────────────
export async function updateShippingAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await requireAdmin();
  const freeRupees = Number(formData.get("freeThresholdRupees"));
  const flatRupees = Number(formData.get("flatRupees"));
  if (!Number.isFinite(freeRupees) || freeRupees < 0) {
    return { error: "Enter a valid free-shipping amount (0 or more)." };
  }
  if (!Number.isFinite(flatRupees) || flatRupees < 0) {
    return { error: "Enter a valid shipping fee (0 or more)." };
  }

  await updateShippingSettings({
    freeShippingThresholdPaise: rupeesToPaise(freeRupees),
    flatShippingPaise: rupeesToPaise(flatRupees),
  });
  // Storefront pages that show shipping need to reflect the new numbers.
  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/policies/shipping");
  return { success: "Shipping settings saved." };
}
