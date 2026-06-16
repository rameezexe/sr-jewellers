"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/social-icons";

/**
 * Lets customers share a product. On phones it opens the native share sheet
 * (WhatsApp, Instagram, etc.); on desktop it copies the link. A dedicated
 * WhatsApp button is always shown for one-tap sharing.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: `Check out ${title}`, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  function shareWhatsApp() {
    const url = window.location.href;
    const text = `Check out ${title} — ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-blush-deep px-4 py-1.5 text-sm text-ink transition-colors hover:bg-blush";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button type="button" onClick={share} className={btn}>
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        {copied ? "Link copied!" : "Share"}
      </button>
      <button
        type="button"
        onClick={shareWhatsApp}
        aria-label="Share on WhatsApp"
        className={btn}
      >
        <WhatsAppIcon size={16} />
        WhatsApp
      </button>
    </div>
  );
}
