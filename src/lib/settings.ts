import "server-only";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/config/site";
import type { ShopSettings } from "@/lib/money";

/**
 * Owner-editable shop settings, stored in a single DB row (id = "shop").
 * Currently just shipping rules. Falls back to the static defaults in
 * src/config/site.ts if the row is missing.
 */

const SETTINGS_ID = "shop";

export async function getShopSettings(): Promise<ShopSettings> {
  const row = await prisma.shopSettings.findUnique({ where: { id: SETTINGS_ID } });
  return {
    freeShippingThresholdPaise:
      row?.freeShippingThresholdPaise ?? SITE.freeShippingThresholdPaise,
    flatShippingPaise: row?.flatShippingPaise ?? SITE.flatShippingPaise,
  };
}

export async function updateShippingSettings(input: ShopSettings) {
  return prisma.shopSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  });
}
