import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

// Always render fresh — order status changes over time.
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blush text-3xl">
          {paid ? "💝" : "⏳"}
        </div>
        <h1 className="mt-4 font-display text-4xl text-brand-dark">
          {paid ? "Thank you!" : "Almost there…"}
        </h1>
        <p className="mt-2 text-muted">
          {paid
            ? "Your order is confirmed. We've emailed you the details and we're packing it with love."
            : "We haven't received payment for this order yet. If you were charged, it will update shortly."}
        </p>
        <p className="mt-4 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-medium text-brand-dark">
          Order {order.orderNumber} · {statusLabel(order.status)}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-blush-deep/60 p-6">
        <h2 className="font-display text-xl text-ink">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-ink">
                {item.name} <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="text-ink">
                {formatPaise(item.pricePaise * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-blush-deep/60 pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Subtotal</dt>
            <dd>{formatPaise(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Shipping</dt>
            <dd>{order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink">
            <dt>Total</dt>
            <dd>{formatPaise(order.totalPaise)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-2xl border border-blush-deep/60 p-6 text-sm">
        <h2 className="font-display text-xl text-ink">Shipping to</h2>
        <p className="mt-2 text-ink/80">
          {order.customerName}
          <br />
          {order.addressLine1}
          {order.addressLine2 && (
            <>
              <br />
              {order.addressLine2}
            </>
          )}
          <br />
          {order.city}, {order.state} — {order.pincode}
          <br />
          📞 {order.phone}
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="text-sm font-medium text-brand hover:text-brand-dark">
          Continue shopping →
        </Link>
      </div>
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Awaiting payment",
    PAID: "Confirmed",
    PROCESSING: "Being packed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };
  return map[status] ?? status;
}
