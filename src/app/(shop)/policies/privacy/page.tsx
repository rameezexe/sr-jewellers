import type { Metadata } from "next";
import { PolicyShell } from "@/components/policy-shell";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PolicyShell title="Privacy Policy">
      <p>
        Your privacy matters to us. This policy explains what information{" "}
        {SITE.name} collects and how we use it.
      </p>
      <h2>What we collect</h2>
      <p>
        When you place an order, we collect your name, email, phone number and
        shipping address. This is used solely to process and deliver your order
        and to contact you about it.
      </p>
      <h2>Payments</h2>
      <p>
        You can pay by UPI or choose Cash on Delivery. We never see or store
        your card, UPI PIN, or banking credentials — UPI payments are made
        directly from your own banking app to ours.
      </p>
      <h2>How we use your information</h2>
      <p>
        We use your details to fulfil orders, provide customer support, and send
        order-related emails. We do not sell your personal information to anyone.
      </p>
      <h2>Your choices</h2>
      <p>
        You can request a copy or deletion of your personal data at any time by
        emailing{" "}
        <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
          {SITE.email}
        </a>
        .
      </p>
    </PolicyShell>
  );
}
