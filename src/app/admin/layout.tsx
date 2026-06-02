import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The login page renders bare (no admin chrome).
  if (!session) return <>{children}</>;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-blush-deep/60 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-xl text-brand-dark">
              {SITE.name} <span className="text-sm text-muted">admin</span>
            </Link>
            <nav className="hidden gap-5 sm:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-sm font-medium text-ink hover:text-brand"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="text-sm text-muted hover:text-brand">
              View store ↗
            </Link>
            <form action={logoutAction}>
              <button className="rounded-full border border-blush-deep px-4 py-1.5 text-sm text-ink hover:bg-blush">
                Log out
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-5 border-t border-blush-deep/60 px-6 py-2 sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
