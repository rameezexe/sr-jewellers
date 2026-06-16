"use client";

import { useActionState } from "react";
import {
  updateAccountAction,
  changePasswordAction,
  type AccountState,
} from "@/app/admin/actions";

const initial: AccountState = {};

const input =
  "w-full rounded-lg border border-blush-deep bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";
const labelText = "mb-1 block text-sm font-medium text-ink";

function Notice({ state }: { state: AccountState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateAccountAction, initial);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className={labelText}>Your name</span>
        <input name="name" defaultValue={name} className={input} />
      </label>
      <label className="block">
        <span className={labelText}>Login email</span>
        <input name="email" type="email" required defaultValue={email} className={input} />
      </label>
      <Notice state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className={labelText}>Current password</span>
        <input name="currentPassword" type="password" required className={input} />
      </label>
      <label className="block">
        <span className={labelText}>New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className={input}
        />
        <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>
      </label>
      <label className="block">
        <span className={labelText}>Confirm new password</span>
        <input name="confirmPassword" type="password" required className={input} />
      </label>
      <Notice state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
