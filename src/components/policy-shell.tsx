export function PolicyShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-brand-dark">{title}</h1>
      <div className="gold-rule my-6" />
      <div className="space-y-4 text-sm leading-relaxed text-ink/85 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}
