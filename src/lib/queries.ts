import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Read helpers used by storefront server components. Centralised so the
 * include/ordering logic lives in one place.
 */

const withImages = {
  images: { orderBy: { position: "asc" } },
} as const;

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: withImages,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getProducts(opts: { categorySlug?: string } = {}) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(opts.categorySlug
        ? { category: { slug: opts.categorySlug } }
        : {}),
    },
    include: withImages,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { ...withImages, category: true },
  });
}

export type ProductWithImages = Awaited<
  ReturnType<typeof getProducts>
>[number];
