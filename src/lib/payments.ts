import "server-only";
import QRCode from "qrcode";
import { SITE } from "@/config/site";

/**
 * Payments without a gateway. Two options at checkout:
 *
 *  • UPI — we show the shop's UPI ID + a QR code. The customer pays from any
 *    UPI app and enters the reference number; the owner confirms the payment
 *    landed in her account from /admin.
 *  • COD — Cash on Delivery. The customer pays when the parcel arrives.
 *
 * No KYC, no gateway fees, no card data ever touches the server.
 */

export const PAYMENT_METHODS = ["UPI", "COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** The shop's UPI ID (VPA), e.g. "shopname@oksbi". Set UPI_ID in .env. */
export function upiId(): string {
  return process.env.UPI_ID?.trim() ?? "";
}

/** UPI is available only once a UPI ID has been configured. */
export function upiConfigured(): boolean {
  return Boolean(upiId());
}

/** Name shown to the customer in their UPI app. Defaults to the shop name. */
export function upiPayeeName(): string {
  return process.env.UPI_PAYEE_NAME?.trim() || SITE.name;
}

/** Build a UPI deep link that opens any UPI app pre-filled with our details. */
export function buildUpiLink(amountPaise: number, orderNumber: string): string {
  const query = [
    `pa=${encodeURIComponent(upiId())}`,
    `pn=${encodeURIComponent(upiPayeeName())}`,
    `am=${(amountPaise / 100).toFixed(2)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(`Order ${orderNumber}`)}`,
  ].join("&");
  return `upi://pay?${query}`;
}

/** Render a UPI link as a scannable QR code (PNG data URL). */
export function buildUpiQrDataUrl(link: string): Promise<string> {
  return QRCode.toDataURL(link, {
    margin: 1,
    width: 320,
    color: { dark: "#3e2a2e", light: "#ffffff" },
  });
}
