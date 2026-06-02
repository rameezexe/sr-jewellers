import type { Metadata } from "next";
import { PolicyShell } from "@/components/policy-shell";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <PolicyShell title="Terms & Conditions">
      <p>
        Welcome to {SITE.name}. By using this website and placing an order, you
        agree to the following terms.
      </p>
      <h2>Products &amp; pricing</h2>
      <p>
        We try to display product colours and details as accurately as possible,
        but slight variations may occur due to screens and photography. All
        prices are in Indian Rupees (INR) and inclusive of applicable taxes
        unless stated otherwise. Prices and availability may change without
        notice.
      </p>
      <h2>Orders &amp; payment</h2>
      <p>
        Payments are processed securely through Razorpay. We reserve the right
        to cancel any order in case of suspected fraud, pricing errors, or stock
        unavailability — in which case any amount paid will be refunded in full.
      </p>
      <h2>Intellectual property</h2>
      <p>
        All content on this site, including images and text, belongs to{" "}
        {SITE.name} and may not be used without permission.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Email us at{" "}
        <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
          {SITE.email}
        </a>
        .
      </p>
    </PolicyShell>
  );
}
