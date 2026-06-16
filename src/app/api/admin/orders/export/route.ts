import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Download all orders as a CSV (opens directly in Excel / Google Sheets).
 * Amounts are plain rupee numbers (no ₹ symbol) so they can be summed, and we
 * prepend a UTF-8 BOM so Excel reads names/notes correctly.
 */

const HEADERS = [
  "Order",
  "Date",
  "Status",
  "Payment",
  "UPI reference",
  "Customer",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "Pincode",
  "Items",
  "Subtotal (₹)",
  "Shipping (₹)",
  "Total (₹)",
  "Paid at",
  "Notes",
];

/** Quote a CSV field and escape any embedded quotes. */
function cell(value: string | number): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

function dateTime(d: Date): string {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const rows = orders.map((o) =>
    [
      o.orderNumber,
      dateTime(o.createdAt),
      o.status,
      o.paymentMethod === "COD" ? "Cash on Delivery" : "UPI",
      o.paymentRef,
      o.customerName,
      o.email,
      o.phone,
      [o.addressLine1, o.addressLine2].filter(Boolean).join(", "),
      o.city,
      o.state,
      o.pincode,
      o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
      rupees(o.subtotalPaise),
      rupees(o.shippingPaise),
      rupees(o.totalPaise),
      o.paidAt ? dateTime(o.paidAt) : "",
      o.notes,
    ]
      .map(cell)
      .join(","),
  );

  const csv =
    "﻿" + [HEADERS.map(cell).join(","), ...rows].join("\r\n") + "\r\n";

  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
