"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useShopSettings } from "@/components/shop-settings-context";
import { formatPaise, computeShipping } from "@/lib/money";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalPaise } = useCart();
  const { freeShippingThresholdPaise, flatShippingPaise } = useShopSettings();
  const shipping = computeShipping(
    subtotalPaise,
    freeShippingThresholdPaise,
    flatShippingPaise,
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-brand-dark">Your cart</h1>
        <p className="mt-4 text-muted">Your cart is empty right now.</p>
        <Link
          href="/shop"
          className="mt-6 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl text-brand-dark">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="space-y-6 lg:col-span-2">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 border-b border-blush-deep/60 pb-6"
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-blush">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-display text-lg text-ink hover:text-brand"
                  >
                    {item.name}
                  </Link>
                  <span className="font-semibold text-ink">
                    {formatPaise(item.pricePaise * item.quantity)}
                  </span>
                </div>
                <span className="text-sm text-muted">
                  {formatPaise(item.pricePaise)} each
                </span>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="rounded border border-blush-deep p-1.5 text-ink hover:bg-blush"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    className="rounded border border-blush-deep p-1.5 text-ink hover:bg-blush disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="ml-4 flex items-center gap-1 text-sm text-muted hover:text-brand"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-2xl bg-blush/50 p-6">
          <h2 className="font-display text-2xl text-ink">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd>{formatPaise(subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPaise(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-blush-deep/60 pt-2 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatPaise(subtotalPaise + shipping)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted hover:text-brand"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
