import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { razorpayConfigured } from "@/lib/razorpay";
import { cloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboard() {
  await requireAdmin();

  const [productCount, lowStock, paidAgg, pendingShip, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: { lte: 3 }, isActive: true } }),
      prisma.order.aggregate({
        _sum: { totalPaise: true },
        _count: true,
        where: { status: { in: [...PAID_STATUSES] } },
      }),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const setupItems = [
    { label: "Razorpay payments", ok: razorpayConfigured() },
    { label: "Cloudinary photos", ok: cloudinaryConfigured() },
    { label: "Resend emails", ok: Boolean(process.env.RESEND_API_KEY) },
  ];
  const setupIncomplete = setupItems.some((s) => !s.ok);

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark">Dashboard</h1>

      {setupIncomplete && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
          <p className="font-semibold text-gold-dark">Finish setup</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-ink/80">
            {setupItems.map((s) => (
              <li key={s.label}>
                {s.ok ? "✅" : "⬜️"} {s.label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted">
            Add the missing keys to your <code>.env</code> file (see README).
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue (paid)" value={formatPaise(paidAgg._sum.totalPaise ?? 0)} />
        <Stat label="Paid orders" value={String(paidAgg._count)} />
        <Stat label="To ship" value={String(pendingShip)} highlight={pendingShip > 0} />
        <Stat label="Products" value={String(productCount)} />
      </div>

      {lowStock > 0 && (
        <p className="mt-4 text-sm text-brand">
          ⚠️ {lowStock} product{lowStock === 1 ? "" : "s"} low on stock.{" "}
          <Link href="/admin/products" className="underline">
            Review
          </Link>
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm text-brand hover:text-brand-dark">
          All orders →
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-blush-deep/60 bg-white">
        {recentOrders.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-blush/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-blush-deep/40 hover:bg-blush/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-dark hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{o.customerName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{formatPaise(o.totalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-brand bg-brand/5" : "border-blush-deep/60 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    PAID: "bg-green-100 text-green-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
