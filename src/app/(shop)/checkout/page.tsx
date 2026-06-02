"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { useCart } from "@/components/cart-context";
import { formatPaise, shippingForSubtotal } from "@/lib/money";
import { SITE } from "@/config/site";
import { INDIAN_STATES } from "@/lib/states";

// Razorpay Checkout injects this global once its script loads.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { items, subtotalPaise, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const shipping = shippingForSubtotal(subtotalPaise);
  const total = subtotalPaise + shipping;

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          customer: form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      if (typeof window.Razorpay !== "function") {
        setError("Payment is still loading — please try again in a moment.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amountPaise,
        currency: SITE.currency,
        name: SITE.name,
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: data.prefill,
        theme: { color: "#c96b86" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (resp: any) => {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (verify.ok) {
            clear();
            router.push(`/order/${data.orderNumber}`);
          } else {
            setError(
              "We couldn't confirm your payment. If money was deducted, contact us with your order number.",
            );
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-brand-dark">Checkout</h1>
        <p className="mt-4 text-muted">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Browse jewellery
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-blush-deep bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl text-brand-dark">Checkout</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-5">
          {/* Shipping form */}
          <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-3">
            <h2 className="font-display text-2xl text-ink">Shipping details</h2>

            <Field label="Full name" required>
              <input className={inputClass} required value={form.name} onChange={update("name")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required>
                <input className={inputClass} type="email" required value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Phone" required>
                <input className={inputClass} type="tel" required value={form.phone} onChange={update("phone")} />
              </Field>
            </div>
            <Field label="Address" required>
              <input className={inputClass} required placeholder="House no, street, area" value={form.addressLine1} onChange={update("addressLine1")} />
            </Field>
            <Field label="Address line 2">
              <input className={inputClass} placeholder="Landmark, apartment (optional)" value={form.addressLine2} onChange={update("addressLine2")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" required>
                <input className={inputClass} required value={form.city} onChange={update("city")} />
              </Field>
              <Field label="State" required>
                <select className={inputClass} required value={form.state} onChange={update("state")}>
                  <option value="">Select…</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pincode" required>
                <input className={inputClass} required inputMode="numeric" maxLength={6} value={form.pincode} onChange={update("pincode")} />
              </Field>
            </div>
            <Field label="Order notes">
              <textarea className={inputClass} rows={2} placeholder="Anything we should know? (optional)" value={form.notes} onChange={update("notes")} />
            </Field>

            {error && (
              <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Please wait…" : `Pay ${formatPaise(total)}`}
            </button>
            <p className="text-center text-xs text-muted">
              Secure payment via Razorpay — UPI, cards, netbanking &amp; wallets.
            </p>
          </form>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl bg-blush/50 p-6 lg:col-span-2">
            <h2 className="font-display text-2xl text-ink">Your order</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-ink">{item.name}</p>
                    <p className="text-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {formatPaise(item.pricePaise * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-blush-deep/60 pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd>{formatPaise(subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatPaise(shipping)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd>{formatPaise(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {children}
    </label>
  );
}
