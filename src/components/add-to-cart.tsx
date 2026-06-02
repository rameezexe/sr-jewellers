"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart-context";

export function AddToCart({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;

  if (soldOut) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-full bg-blush-deep py-3.5 text-sm font-semibold text-muted"
      >
        Sold out
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex items-center justify-between rounded-full border border-blush-deep px-3 sm:w-32">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="p-2 text-ink hover:text-brand"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>
        <span className="text-sm font-medium">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          disabled={qty >= product.stock}
          className="p-2 text-ink hover:text-brand disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
      </div>
      <button
        onClick={() => addItem(product, qty)}
        className="flex-1 rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        Add to cart
      </button>
    </div>
  );
}
