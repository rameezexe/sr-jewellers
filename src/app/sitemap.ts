import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/policies/shipping",
    "/policies/returns",
    "/policies/terms",
    "/policies/privacy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  let products: { slug: string; updatedAt: Date }[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // DB not reachable at build time — static routes are enough.
  }

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
