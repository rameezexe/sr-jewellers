import Link from "next/link";
import { InstagramIcon, FacebookIcon } from "@/components/social-icons";
import { SITE } from "@/config/site";
import { whatsappLink } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-blush-deep/60 bg-blush/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <h3 className="font-display text-xl text-brand-dark">{SITE.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-muted">{SITE.description}</p>
          <div className="mt-4 flex gap-3">
            {SITE.instagram && (
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-ink transition-colors hover:text-brand"
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
                className="text-ink transition-colors hover:text-brand"
              >
                <FacebookIcon size={20} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Shop
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/shop" className="hover:text-brand">
                All jewellery
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-brand">
                Your cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Help
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/policies/shipping" className="hover:text-brand">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/policies/returns" className="hover:text-brand">
                Returns &amp; Refunds
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="hover:text-brand">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy" className="hover:text-brand">
                Privacy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Contact
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-brand">
                {SITE.email}
              </a>
            </li>
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-brand">
                {SITE.phone}
              </a>
            </li>
            {SITE.whatsapp && (
              <li>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-blush-deep/60 py-4">
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} {SITE.name}. Made with 💕 in India.
        </p>
      </div>
    </footer>
  );
}
