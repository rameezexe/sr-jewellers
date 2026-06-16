import { clsx, type ClassValue } from "clsx";
import { SITE } from "@/config/site";

/** Tiny className combiner (no tailwind-merge needed for this project). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * WhatsApp "click to chat" link, pre-filled with a message so the customer's
 * chat opens with text ready to send. Returns "" if no number is configured.
 */
export function whatsappLink(message: string = SITE.whatsappMessage): string {
  if (!SITE.whatsapp) return "";
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Make a URL-safe slug from a product/category name. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Human-friendly order number, e.g. SR-7F3K9A2. */
export function generateOrderNumber(): string {
  const rand = Math.random().toString(36).toUpperCase().slice(2, 9);
  return `SR-${rand}`;
}
