import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm, PasswordForm } from "@/components/admin/settings-forms";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your login. Shop-wide details (name, contact, UPI ID, shipping)
        live in the project files — ask whoever set up the site to change those.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-blush-deep/60 bg-white p-6">
          <h2 className="font-display text-xl text-ink">Account</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            The email and password you use to sign in here.
          </p>
          <AccountForm name={admin?.name ?? ""} email={admin?.email ?? session.email} />
        </section>

        <section className="rounded-xl border border-blush-deep/60 bg-white p-6">
          <h2 className="font-display text-xl text-ink">Change password</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            Pick something only you know — especially if it&apos;s still the
            default from setup.
          </p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
