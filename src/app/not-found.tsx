import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="font-display text-6xl text-brand-light">404</p>
      <h1 className="mt-2 font-display text-3xl text-brand-dark">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 text-muted">
        The piece you&apos;re looking for may have sold out or moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
