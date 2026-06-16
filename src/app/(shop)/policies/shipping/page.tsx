import type { Metadata } from "next";
import { PolicyShell } from "@/components/policy-shell";
import { SITE } from "@/config/site";
import { formatPaise } from "@/lib/money";
import { getShopSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Shipping Policy" };

export default async function ShippingPolicy() {
  const { freeShippingThresholdPaise, flatShippingPaise } = await getShopSettings();
  return (
    <PolicyShell title="Shipping Policy">
      <p>
        We ship across India. Orders are usually packed and dispatched within{" "}
        <strong>2–4 business days</strong>. Once shipped, delivery typically
        takes <strong>4–8 business days</strong> depending on your location.
      </p>
      <h2>Shipping charges</h2>
      <p>
        {freeShippingThresholdPaise <= 0 ? (
          <>
            Shipping is <strong>free</strong> on all orders.
          </>
        ) : (
          <>
            A flat shipping fee of {formatPaise(flatShippingPaise)} applies to
            orders below {formatPaise(freeShippingThresholdPaise)}. Orders at or
            above {formatPaise(freeShippingThresholdPaise)} ship{" "}
            <strong>free</strong>.
          </>
        )}
      </p>
      <h2>Tracking</h2>
      <p>
        Once your order ships, we&apos;ll share tracking details by email. If you
        haven&apos;t received an update within a few days, please reach out at{" "}
        <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
          {SITE.email}
        </a>
        .
      </p>
      <h2>Delays</h2>
      <p>
        Occasionally, delivery may be delayed due to courier or regional issues
        beyond our control. We&apos;ll always do our best to keep you informed.
      </p>
    </PolicyShell>
  );
}
