"use client";

import { useTransition } from "react";
import { deleteCategoryAction } from "@/app/admin/actions";

export function DeleteCategoryButton({
  id,
  name,
  count,
}: {
  id: string;
  name: string;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const message =
          count > 0
            ? `Delete "${name}"? Its ${count} product${count === 1 ? "" : "s"} will become uncategorised (they won't be deleted).`
            : `Delete "${name}"? This can't be undone.`;
        if (confirm(message)) {
          startTransition(() => deleteCategoryAction(id));
        }
      }}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
