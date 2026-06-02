import "server-only";
import Razorpay from "razorpay";
import crypto from "node:crypto";

/**
 * Razorpay integration (Cards + UPI + netbanking + wallets).
 *
 * Flow:
 *  1. /api/checkout/create-order creates a Razorpay Order + a PENDING Order row.
 *  2. The browser opens Razorpay Checkout with that order id.
 *  3. On success Razorpay returns { order_id, payment_id, signature } which we
 *     verify in /api/checkout/verify (HMAC-SHA256 with the key secret).
 *  4. A webhook (/api/razorpay/webhook) is the source of truth as a backup, in
 *     case the customer closes the tab before the verify call lands.
 */

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpay(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/** The public key id, safe to expose to the browser. */
export function publicKeyId(): string {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

/** Verify the signature returned by Razorpay Checkout on the client. */
export function verifyPaymentSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, args.signature);
}

/** Verify a webhook payload using the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
