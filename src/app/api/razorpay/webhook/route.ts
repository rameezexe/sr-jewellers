import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/orders";

/**
 * Razorpay webhook — the reliable source of truth for payment success, in case
 * the customer closes the tab before the client-side verify call runs.
 *
 * Set this up in the Razorpay dashboard (Settings → Webhooks):
 *   URL:    https://YOUR_DOMAIN/api/razorpay/webhook
 *   Events: payment.captured, order.paid
 *   Secret: copy into RAZORPAY_WEBHOOK_SECRET
 *
 * We must read the RAW body to verify the signature, so don't parse it first.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment.id) {
      await markOrderPaid(payment.order_id, payment.id);
    }
  }

  // Always 200 so Razorpay doesn't keep retrying once we've received it.
  return NextResponse.json({ received: true });
}
