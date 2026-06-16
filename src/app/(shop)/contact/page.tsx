import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { whatsappLink } from "@/lib/utils";
import { InstagramIcon, FacebookIcon } from "@/components/social-icons";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE.name}.`,
};

export default function ContactPage() {
  const waLink = SITE.whatsapp ? whatsappLink() : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-brand-dark">Get in touch</h1>
      <div className="gold-rule my-6" />
      <p className="text-ink/85">
        Have a question about an order, a piece, or shipping? We&apos;d love to
        hear from you — we usually reply within a day.
      </p>

      <div className="mt-8 space-y-4">
        <ContactRow label="Email">
          <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
            {SITE.email}
          </a>
        </ContactRow>
        <ContactRow label="Phone">
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="text-brand hover:underline"
          >
            {SITE.phone}
          </a>
        </ContactRow>
        {waLink && (
          <ContactRow label="WhatsApp">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Message us on WhatsApp
            </a>
          </ContactRow>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        {SITE.instagram && (
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-ink hover:bg-blush-deep hover:text-brand"
          >
            <InstagramIcon size={20} />
          </a>
        )}
        {SITE.facebook && (
          <a
            href={SITE.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-ink hover:bg-blush-deep hover:text-brand"
          >
            <FacebookIcon size={20} />
          </a>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-sm font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="text-ink">{children}</span>
    </div>
  );
}
