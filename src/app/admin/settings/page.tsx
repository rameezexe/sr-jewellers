import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AccountForm,
  PasswordForm,
  ShippingForm,
} from "@/components/admin/settings-forms";
import { getShopSettings } from "@/lib/settings";
import { paiseToRupees } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const [admin, shipping] = await Promise.all([
    prisma.adminUser.findUnique({ where: { id: session.adminId } }),
    getShopSettings(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your login and shipping charges. Other shop-wide details (name,
        contact, UPI ID) live in the project files.
      </p>

      <section className="mt-6 rounded-xl border border-blush-deep/60 bg-white p-6">
        <h2 className="font-display text-xl text-ink">Shipping charges</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Set when customers pay for shipping. Changes apply to new orders right
          away.
        </p>
        <div className="max-w-md">
          <ShippingForm
            freeThresholdRupees={paiseToRupees(shipping.freeShippingThresholdPaise)}
            flatRupees={paiseToRupees(shipping.flatShippingPaise)}
          />
        </div>
      </section>

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
