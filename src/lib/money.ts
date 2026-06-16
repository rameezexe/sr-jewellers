import { SITE } from "@/config/site";

/**
 * Money helpers. We always store amounts as integer **paise** to avoid
 * floating-point rounding bugs (₹1 = 100 paise).
 */

const formatter = new Intl.NumberFormat(SITE.locale, {
  style: "currency",
  currency: SITE.currency,
  maximumFractionDigits: 0,
});

/** Format paise as a display string, e.g. 129900 -> "₹1,299". */
export function formatPaise(paise: number): string {
  return formatter.format(paise / 100);
}

/** Convert a rupee amount (what an admin types) into paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise back to rupees (e.g. for pre-filling an edit form). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Owner-editable shipping settings (stored in the DB, see lib/settings.ts). */
export type ShopSettings = {
  freeShippingThresholdPaise: number;
  flatShippingPaise: number;
};

/** Shipping fee for a subtotal given explicit thresholds (free at/above). */
export function computeShipping(
  subtotalPaise: number,
  freeThresholdPaise: number,
  flatPaise: number,
): number {
  if (subtotalPaise <= 0) return 0;
  if (subtotalPaise >= freeThresholdPaise) return 0;
  return flatPaise;
}

/** Shipping fee using the static defaults in site config (fallback). */
export function shippingForSubtotal(subtotalPaise: number): number {
  return computeShipping(
    subtotalPaise,
    SITE.freeShippingThresholdPaise,
    SITE.flatShippingPaise,
  );
}
