import "server-only";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { shippingForSubtotal } from "@/lib/money";
import { sendOrderEmails } from "@/lib/email";
import type { PaymentMethod } from "@/lib/payments";

/**
 * Order creation + lifecycle. All money is recomputed from the database here —
 * we never trust prices/totals sent by the browser. Stock is reserved the
 * moment an order is placed (so two shoppers can't grab the last piece) and
 * returned if the order is later cancelled or refunded.
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

// Statuses where the items have been returned to stock (no longer reserved).
const RELEASED: ReadonlySet<string> = new Set(["CANCELLED", "REFUNDED"]);

type OrderWithItems = Awaited<ReturnType<typeof createPendingOrder>>;

function toEmailPayload(order: OrderWithItems) {
  return {
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
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef,
    subtotalPaise: order.subtotalPaise,
    shippingPaise: order.shippingPaise,
    totalPaise: order.totalPaise,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      pricePaise: i.pricePaise,
    })),
  };
}

/**
 * Create a PENDING order from the cart with server-trusted prices, reserving
 * stock atomically. For Cash on Delivery we email the customer + owner right
 * away; for UPI we wait until the customer submits their payment reference
 * (see {@link attachUpiReference}).
 */
export async function createPendingOrder(
  items: CheckoutItem[],
  customer: CheckoutCustomer,
  paymentMethod: PaymentMethod,
) {
  if (items.length === 0) throw new Error("Your cart is empty.");
  const ids = items.map((i) => i.productId);

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { images: { take: 1, orderBy: { position: "asc" } } },
    });

    let subtotalPaise = 0;
    const orderItems = items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) throw new Error("A product in your cart is no longer available.");
      const quantity = Math.max(1, it.quantity);
      if (p.stock < quantity) {
        throw new Error(
          p.stock < 1
            ? `Sorry, "${p.name}" just sold out.`
            : `Only ${p.stock} left of "${p.name}". Please adjust your cart.`,
        );
      }
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

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        paymentMethod,
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

    // Reserve stock immediately.
    for (const it of orderItems) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      });
    }
    return created;
  });

  if (paymentMethod === "COD") {
    await sendOrderEmails(toEmailPayload(order));
  }
  return order;
}

/**
 * Attach the UPI reference the customer enters after paying, and fire the
 * confirmation + owner-alert emails (once). The owner verifies the reference
 * against her bank/UPI app and marks the order PAID in /admin.
 */
export async function attachUpiReference(orderNumber: string, reference: string) {
  const existing = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!existing) return null;

  const firstTime =
    existing.paymentMethod === "UPI" &&
    existing.status === "PENDING" &&
    !existing.paymentRef;

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: { paymentRef: reference },
    include: { items: true },
  });

  if (firstTime) await sendOrderEmails(toEmailPayload(order));
  return order;
}

/**
 * Change an order's status (from /admin), keeping stock consistent: returning
 * items to stock when an order moves into CANCELLED/REFUNDED, and re-reserving
 * them if it's reactivated. Stamps paidAt the first time it's marked PAID.
 */
export async function applyStatusChange(orderId: string, newStatus: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return null;
    if (order.status === newStatus) return order;

    const wasReleased = RELEASED.has(order.status);
    const willRelease = RELEASED.has(newStatus);
    const stockDelta = !wasReleased && willRelease ? 1 : wasReleased && !willRelease ? -1 : 0;

    if (stockDelta !== 0) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: stockDelta * item.quantity } },
          });
        }
      }
    }

    const paidAt = newStatus === "PAID" && !order.paidAt ? new Date() : order.paidAt;
    return tx.order.update({
      where: { id: orderId },
      data: { status: newStatus, paidAt },
    });
  });
}
