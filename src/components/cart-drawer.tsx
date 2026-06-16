"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useShopSettings } from "@/components/shop-settings-context";
import { formatPaise, computeShipping } from "@/lib/money";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, removeItem, subtotalPaise } =
    useCart();
  const { freeShippingThresholdPaise, flatShippingPaise } = useShopSettings();

  const shipping = computeShipping(
    subtotalPaise,
    freeShippingThresholdPaise,
    flatShippingPaise,
  );
  const remainingForFree = freeShippingThresholdPaise - subtotalPaise;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-blush-deep/60 px-5 py-4">
          <h2 className="font-display text-xl text-brand-dark">Your cart</h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart">
            <X size={22} className="text-ink hover:text-brand" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Browse jewellery
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {remainingForFree > 0 && (
                <p className="mb-4 rounded-lg bg-blush px-3 py-2 text-center text-xs text-brand-dark">
                  Add {formatPaise(remainingForFree)} more for free shipping!
                </p>
              )}
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-blush">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-ink hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      <span className="text-sm text-muted">
                        {formatPaise(item.pricePaise)}
                      </span>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="rounded border border-blush-deep p-1 text-ink hover:bg-blush"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="rounded border border-blush-deep p-1 text-ink hover:bg-blush disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-muted hover:text-brand"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-blush-deep/60 px-5 py-4">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPaise(shipping)}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>{formatPaise(subtotalPaise + shipping)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-4 block rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="mt-2 block text-center text-xs text-muted hover:text-brand"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
