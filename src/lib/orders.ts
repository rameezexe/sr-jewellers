import "server-only";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { shippingForSubtotal } from "@/lib/money";
import { sendOrderEmails } from "@/lib/email";

/**
 * Order creation + payment reconciliation. All money is recomputed from the
 * database here — we never trust prices/totals sent by the browser.
 */

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
};

/** Create a PENDING order from the cart, with server-trusted prices. */
export async function createPendingOrder(
  items: CheckoutItem[],
  customer: CheckoutCustomer,
) {
  if (items.length === 0) throw new Error("Your cart is empty.");

  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
  });

  let subtotalPaise = 0;
  const orderItems = items.map((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p) throw new Error("A product in your cart is no longer available.");
    if (p.stock < 1) throw new Error(`Sorry, "${p.name}" just sold out.`);
    if (it.quantity > p.stock) {
      throw new Error(`Only ${p.stock} left of "${p.name}". Please adjust your cart.`);
    }
    const quantity = Math.max(1, it.quantity);
    subtotalPaise += p.pricePaise * quantity;
    return {
      productId: p.id,
      name: p.name,
      pricePaise: p.pricePaise,
      quantity,
      imageUrl: p.images[0]?.url ?? "",
    };
  });

  const shippingPaise = shippingForSubtotal(subtotalPaise);
  const totalPaise = subtotalPaise + shippingPaise;

  return prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2 ?? "",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      notes: customer.notes ?? "",
      subtotalPaise,
      shippingPaise,
      totalPaise,
      items: { create: orderItems },
    },
    include: { items: true },
  });
}

/**
 * Mark an order paid, decrement stock, and email confirmations. Idempotent:
 * safe to call from both the client verify step AND the webhook — only the
 * first call (PENDING -> PAID) does the work.
 */
export async function markOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
) {
  const { order, justPaid } = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { razorpayOrderId },
      include: { items: true },
    });
    if (!existing) return { order: null, justPaid: false };
    if (existing.status !== "PENDING") return { order: existing, justPaid: false };

    for (const item of existing.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const updated = await tx.order.update({
      where: { id: existing.id },
      data: {
        status: "PAID",
        razorpayPaymentId,
        paidAt: new Date(),
      },
      include: { items: true },
    });
    return { order: updated, justPaid: true };
  });

  // Fire emails only once, and outside the transaction.
  if (order && justPaid) {
    await sendOrderEmails({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      notes: order.notes,
      subtotalPaise: order.subtotalPaise,
      shippingPaise: order.shippingPaise,
      totalPaise: order.totalPaise,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        pricePaise: i.pricePaise,
      })),
    });
  }

  return order;
}
