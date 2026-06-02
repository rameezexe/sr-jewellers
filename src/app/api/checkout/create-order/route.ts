import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingOrder } from "@/lib/orders";
import { getRazorpay, razorpayConfigured, publicKeyId } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/config/site";

const schema = z.object({
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
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payments aren't set up yet. Please contact us to order." },
      { status: 503 },
    );
  }

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

  try {
    const order = await createPendingOrder(
      parsed.data.items,
      parsed.data.customer,
    );

    // Create the matching Razorpay order.
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: order.totalPaise,
      currency: SITE.currency,
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      keyId: publicKeyId(),
      razorpayOrderId: rzpOrder.id,
      amountPaise: order.totalPaise,
      orderNumber: order.orderNumber,
      prefill: {
        name: order.customerName,
        email: order.email,
        contact: order.phone,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
