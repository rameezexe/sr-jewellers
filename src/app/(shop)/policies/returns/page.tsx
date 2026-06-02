import type { Metadata } from "next";
import { PolicyShell } from "@/components/policy-shell";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Returns & Refunds" };

export default function ReturnsPolicy() {
  return (
    <PolicyShell title="Returns & Refunds">
      <p>
        We want you to love your jewellery. If something isn&apos;t right, please
        contact us at{" "}
        <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
          {SITE.email}
        </a>{" "}
        within <strong>48 hours</strong> of delivery.
      </p>
      <h2>Damaged or wrong items</h2>
      <p>
        If your order arrives damaged, defective, or incorrect, we&apos;ll
        gladly arrange a replacement or full refund. Please share a clear photo
        and your order number so we can sort it out quickly. An{" "}
        <strong>unboxing video</strong> helps us process these claims fastest.
      </p>
      <h2>Hygiene &amp; fragility</h2>
      <p>
        For hygiene reasons, earrings cannot be returned unless they arrive
        damaged. As jewellery is delicate, we&apos;re unable to accept returns
        for change-of-mind once an item has been worn.
      </p>
      <h2>Refunds</h2>
      <p>
        Approved refunds are processed to your original payment method within{" "}
        <strong>5–7 business days</strong>. You&apos;ll receive a confirmation
        once the refund is initiated.
      </p>
      <h2>Cancellations</h2>
      <p>
        Orders can be cancelled before they are shipped. Once an order has been
        dispatched, it can no longer be cancelled.
      </p>
    </PolicyShell>
  );
}
