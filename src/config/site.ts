// ─────────────────────────────────────────────────────────────────────────
//  EDIT ME — this is the one place to change shop-wide settings.
//  (Brand name, contact details, social links, shipping rules.)
// ─────────────────────────────────────────────────────────────────────────

export const SITE = {
  /** Shop name shown in the header, page titles, and emails. */
  name: "SR Jewellers",
  /** Short tagline under the logo / in the hero. */
  tagline: "Delicate Korean jewellery, delivered across India",
  /** One-line description for SEO / social previews. */
  description:
    "Hand-picked Korean-style jewellery — earrings, necklaces, rings and more. Shipped across India with love.",

  /** Customer-facing contact details (shown in footer + policies). */
  email: "srashaikh92@gmail.com",
  phone: "+91 91676 08665",
  whatsapp: "919167608665", // digits only, country code first
  /** Pre-typed message that opens in WhatsApp when a customer taps "Chat". */
  whatsappMessage: "Hi SR Jewellers! 💕 I have a question about your jewellery.",

  /** Social links — leave blank ("") to hide an icon. */
  instagram: "https://instagram.com/s_r.jewellery",
  facebook:
    "https://www.facebook.com/marketplace/profile/100001490865731/?ref=permalink&mibextid=dXMIcH",

  /** Money. Everything internally is stored in paise (₹1 = 100 paise). */
  currency: "INR",
  locale: "en-IN",

  /**
   * Shipping. Orders at/above the free-shipping threshold ship free,
   * otherwise a flat fee applies. All values in paise.
   */
  freeShippingThresholdPaise: 99900, // ₹999
  flatShippingPaise: 6900, // ₹69

  /** Public base URL — set NEXT_PUBLIC_SITE_URL in production (Vercel). */
  get url() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
} as const;

export type Site = typeof SITE;
