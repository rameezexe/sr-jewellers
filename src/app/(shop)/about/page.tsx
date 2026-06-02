import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Our Story",
  description: `The story behind ${SITE.name}.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-brand-dark">Our story</h1>
      <div className="gold-rule my-6" />
      <div className="space-y-4 leading-relaxed text-ink/85">
        <p>
          {SITE.name} began as a small passion for delicate, Korean-inspired
          jewellery — the kind of pieces that feel special but go with
          everything you wear.
        </p>
        <p>
          What started on Instagram and Facebook Marketplace has grown into this
          little online home, where you can browse the full collection and have
          your favourites shipped straight to your door, anywhere in India.
        </p>
        <p>
          Every piece is hand-picked for quality and that effortless, everyday
          elegance. We pack each order with care, because we want you to feel a
          little bit of joy the moment it arrives. 💕
        </p>
        <p>
          Thank you for supporting a small, family-run business. It means the
          world to us.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Shop the collection
        </Link>
        {SITE.instagram && (
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand px-7 py-3 text-sm font-semibold text-brand hover:bg-blush"
          >
            Follow on Instagram
          </a>
        )}
      </div>
    </div>
  );
}
