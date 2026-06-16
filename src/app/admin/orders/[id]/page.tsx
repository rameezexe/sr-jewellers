import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-brand">
        ← Back to orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-dark">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-muted">
            Placed{" "}
            {order.createdAt.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} current={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-blush-deep/60 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-blush/50 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-t border-blush-deep/40">
                    <td className="px-4 py-3 text-ink">{i.name}</td>
                    <td className="px-4 py-3 text-center text-muted">{i.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatPaise(i.pricePaise)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatPaise(i.pricePaise * i.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd>{formatPaise(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Shipping</dt>
              <dd>
                {order.shippingPaise === 0
                  ? "Free"
                  : formatPaise(order.shippingPaise)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-blush-deep/60 pt-1 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatPaise(order.totalPaise)}</dd>
            </div>
          </dl>
        </div>

        {/* Customer + shipping */}
        <div className="space-y-4">
          <div className="rounded-xl border border-blush-deep/60 bg-white p-5 text-sm">
            <h2 className="font-display text-lg text-ink">Ship to</h2>
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
            </p>
            <p className="mt-3 text-ink/80">
              📞{" "}
              <a href={`tel:${order.phone}`} className="hover:text-brand">
                {order.phone}
              </a>
              <br />
              ✉️{" "}
              <a href={`mailto:${order.email}`} className="hover:text-brand">
                {order.email}
              </a>
            </p>
            {order.notes && (
              <p className="mt-3 rounded-lg bg-blush/60 p-2 text-ink/80">
                <span className="font-medium">Note:</span> {order.notes}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blush-deep/60 bg-white p-5 text-sm">
            <h2 className="font-display text-lg text-ink">Payment</h2>
            <p className="mt-2 text-muted">
              Method:{" "}
              <span className="text-ink">
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}
              </span>
              <br />
              {order.paymentMethod === "UPI" && (
                <>
                  UPI reference:{" "}
                  <span className="text-ink">
                    {order.paymentRef || "— (not submitted yet)"}
                  </span>
                  <br />
                </>
              )}
              Paid:{" "}
              <span className="text-ink">
                {order.paidAt
                  ? order.paidAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not yet"}
              </span>
            </p>
            {order.paymentMethod === "UPI" && order.status === "PENDING" && (
              <p className="mt-3 rounded-lg bg-gold/10 p-2 text-xs text-gold-dark">
                Check your bank/UPI app for {formatPaise(order.totalPaise)}
                {order.paymentRef ? ` (ref ${order.paymentRef})` : ""}, then set
                the status to <strong>PAID</strong> above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
