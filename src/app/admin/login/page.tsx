import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { SITE } from "@/config/site";

export default async function AdminLoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm rounded-2xl border border-blush-deep/60 bg-white p-8 shadow-sm">
        <h1 className="text-center font-display text-3xl text-brand-dark">
          {SITE.name}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">Shop admin</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
