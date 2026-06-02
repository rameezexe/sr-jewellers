"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderStatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          startTransition(() => updateOrderStatusAction(orderId, next));
        }}
        className="rounded-lg border border-blush-deep bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-muted">Saving…</span>}
    </div>
  );
}
