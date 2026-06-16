import { NextResponse } from "next/server";
import { z } from "zod";
import { attachUpiReference } from "@/lib/orders";

/**
 * Called after the customer pays via UPI and enters their payment reference.
 * We just record the reference and email the customer + owner; the owner
 * verifies the money landed and marks the order PAID in /admin.
 */
const schema = z.object({
  orderNumber: z.string().min(1),
  reference: z.string().trim().min(4, "Enter the UPI reference number"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const order = await attachUpiReference(
    parsed.data.orderNumber,
    parsed.data.reference,
  );
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
