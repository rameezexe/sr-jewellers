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

/** Shipping fee for a given subtotal, per the rules in site config. */
export function shippingForSubtotal(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0;
  if (subtotalPaise >= SITE.freeShippingThresholdPaise) return 0;
  return SITE.flatShippingPaise;
}
