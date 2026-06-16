"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-context";
import { useShopSettings } from "@/components/shop-settings-context";
import { formatPaise, computeShipping } from "@/lib/money";
import { INDIAN_STATES } from "@/lib/states";

type PaymentMethod = "UPI" | "COD";

type UpiStep = {
  orderNumber: string;
  amountPaise: number;
  upiId: string;
  upiLink: string;
  qrDataUrl: string;
};

export function CheckoutClient({ upiEnabled }: { upiEnabled: boolean }) {
  const { items, subtotalPaise, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(upiEnabled ? "UPI" : "COD");
  const [upi, setUpi] = useState<UpiStep | null>(null);
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);
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

  const { freeShippingThresholdPaise, flatShippingPaise } = useShopSettings();
  const shipping = computeShipping(
    subtotalPaise,
    freeShippingThresholdPaise,
    flatShippingPaise,
  );
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
          paymentMethod: method,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customer: form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      if (data.method === "COD") {
        clear();
        router.push(`/order/${data.orderNumber}`);
        return;
      }

      // UPI — move to the "pay now" step.
      setUpi({
        orderNumber: data.orderNumber,
        amountPaise: data.amountPaise,
        upiId: data.upiId,
        upiLink: data.upiLink,
        qrDataUrl: data.qrDataUrl,
      });
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function confirmUpi(e: React.FormEvent) {
    e.preventDefault();
    if (!upi) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/confirm-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: upi.orderNumber, reference }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't confirm. Please check the reference.");
        setLoading(false);
        return;
      }
      clear();
      router.push(`/order/${upi.orderNumber}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function copyUpiId() {
    if (!upi) return;
    try {
      await navigator.clipboard.writeText(upi.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available — the ID is shown on screen anyway */
    }
  }

  if (items.length === 0 && !upi) {
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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl text-brand-dark">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {upi ? (
            <UpiPanel
              upi={upi}
              total={total}
              reference={reference}
              setReference={setReference}
              onConfirm={confirmUpi}
              loading={loading}
              error={error}
              copied={copied}
              onCopy={copyUpiId}
              inputClass={inputClass}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <h2 className="pt-2 font-display text-2xl text-ink">Payment</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {upiEnabled && (
                  <PaymentOption
                    checked={method === "UPI"}
                    onChange={() => setMethod("UPI")}
                    title="Pay by UPI"
                    desc="GPay, PhonePe, Paytm & more"
                  />
                )}
                <PaymentOption
                  checked={method === "COD"}
                  onChange={() => setMethod("COD")}
                  title="Cash on Delivery"
                  desc="Pay when your order arrives"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
              >
                {loading
                  ? "Please wait…"
                  : method === "UPI"
                    ? `Continue to UPI payment · ${formatPaise(total)}`
                    : `Place order (Cash on Delivery) · ${formatPaise(total)}`}
              </button>
            </form>
          )}
        </div>

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
  );
}

function UpiPanel({
  upi,
  total,
  reference,
  setReference,
  onConfirm,
  loading,
  error,
  copied,
  onCopy,
  inputClass,
}: {
  upi: UpiStep;
  total: number;
  reference: string;
  setReference: (v: string) => void;
  onConfirm: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  copied: boolean;
  onCopy: () => void;
  inputClass: string;
}) {
  async function pasteReference() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setReference(text.trim());
    } catch {
      /* clipboard blocked — they can paste/type manually */
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Pay {formatPaise(total)} via UPI</h2>
        <p className="mt-1 text-sm text-muted">
          Order <strong>{upi.orderNumber}</strong> is reserved for you. Scan the
          QR or use the UPI ID below, then enter your reference number.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-blush-deep/60 bg-white p-6 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={upi.qrDataUrl}
          alt="UPI payment QR code"
          width={160}
          height={160}
          className="h-40 w-40 rounded-lg border border-blush-deep/40"
        />
        <div className="flex-1 text-sm">
          <p className="text-muted">Scan with any UPI app</p>
          <p className="mt-1 font-medium text-ink">GPay · PhonePe · Paytm · BHIM</p>

          <p className="mt-4 text-muted">Or pay to this UPI ID</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded-md bg-blush/60 px-2 py-1 text-sm text-brand-dark">
              {upi.upiId}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md border border-blush-deep px-2 py-1 text-xs text-ink hover:bg-blush"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <a
            href={upi.upiLink}
            className="mt-4 inline-block rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white sm:hidden"
          >
            Open UPI app
          </a>
        </div>
      </div>

      <form onSubmit={onConfirm} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">
            UPI reference / UTR number <span className="text-brand">*</span>
          </span>
          <div className="flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              required
              autoFocus
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 412345678901"
            />
            <button
              type="button"
              onClick={pasteReference}
              className="shrink-0 rounded-lg border border-blush-deep px-4 text-sm font-medium text-ink hover:bg-blush"
            >
              Paste
            </button>
          </div>
          <span className="mt-1 block text-xs text-muted">
            Copy it from your UPI app, then tap <strong>Paste</strong>.
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Confirming…" : "I've paid — confirm my order"}
        </button>
        <p className="text-center text-xs text-muted">
          We&apos;ll verify the payment and email you once it&apos;s confirmed.
        </p>
      </form>
    </div>
  );
}

function PaymentOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${
        checked ? "border-brand bg-brand/5" : "border-blush-deep bg-white"
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-brand"
      />
      <span>
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-muted">{desc}</span>
      </span>
    </label>
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
