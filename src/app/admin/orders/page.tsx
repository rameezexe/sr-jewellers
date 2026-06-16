import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { StatusBadge } from "@/app/admin/page";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-brand-dark">Orders</h1>
        {orders.length > 0 && (
          <a
            href="/api/admin/orders/export"
            className="rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
          >
            ⬇ Export to Excel
          </a>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-blush-deep/60 bg-white">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-blush/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2 text-center">Items</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-blush-deep/40 hover:bg-blush/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {o.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-ink">{o.customerName}</td>
                  <td className="px-4 py-3 text-center text-muted">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {formatPaise(o.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
