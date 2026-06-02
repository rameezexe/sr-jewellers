"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { SITE } from "@/config/site";
import { useCart } from "@/components/cart-context";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-blush-deep/60 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="text-ink md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center md:items-start">
          <span className="font-display text-2xl font-semibold leading-none text-brand-dark">
            {SITE.name}
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.2em] text-muted sm:block">
            {SITE.tagline}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Cart */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative text-ink transition-colors hover:text-brand"
          aria-label="Open cart"
        >
          <ShoppingBag size={22} />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav className="border-t border-blush-deep/60 bg-cream md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-sm font-medium text-ink hover:bg-blush"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
