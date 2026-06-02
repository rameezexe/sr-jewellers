"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Email</span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="w-full rounded-lg border border-blush-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Password</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-blush-deep bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      {state.error && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
