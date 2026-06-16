import { SITE } from "@/config/site";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/social-icons";

/**
 * Floating "chat with us" button, bottom-right on every storefront page.
 * z-40 keeps it under the cart drawer (z-50). Hidden if no WhatsApp number set.
 */
export function WhatsAppButton() {
  if (!SITE.whatsapp) return null;
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
