import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingOrder } from "@/lib/orders";
import {
  upiConfigured,
  upiId,
  buildUpiLink,
  buildUpiQrDataUrl,
} from "@/lib/payments";

const schema = z.object({
  paymentMethod: z.enum(["UPI", "COD"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  customer: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    addressLine1: z.string().trim().min(1, "Address is required"),
    addressLine2: z.string().trim().optional().default(""),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
    notes: z.string().trim().optional().default(""),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check your details.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { paymentMethod, items, customer } = parsed.data;

  if (paymentMethod === "UPI" && !upiConfigured()) {
    return NextResponse.json(
      { error: "UPI isn't set up yet. Please choose Cash on Delivery." },
      { status: 503 },
    );
  }

  try {
    const order = await createPendingOrder(items, customer, paymentMethod);

    if (paymentMethod === "COD") {
      return NextResponse.json({
        method: "COD",
        orderNumber: order.orderNumber,
        amountPaise: order.totalPaise,
      });
    }

    // UPI — return the deep link + a scannable QR so the customer can pay.
    const upiLink = buildUpiLink(order.totalPaise, order.orderNumber);
    const qrDataUrl = await buildUpiQrDataUrl(upiLink);
    return NextResponse.json({
      method: "UPI",
      orderNumber: order.orderNumber,
      amountPaise: order.totalPaise,
      upiId: upiId(),
      upiLink,
      qrDataUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not place your order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
