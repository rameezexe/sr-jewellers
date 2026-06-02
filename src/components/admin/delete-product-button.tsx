"use client";

import { useTransition } from "react";
import { deleteProductAction } from "@/app/admin/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete "${name}"? This can't be undone.`)) {
          startTransition(() => deleteProductAction(id));
        }
      }}
      className="text-sm text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
