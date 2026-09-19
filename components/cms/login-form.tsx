"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/products/actions";

export function CmsLoginForm() {
  const [state, formAction, pending] = useActionState(signIn, {});

  return (
    <form
      className="w-full max-w-[350px] rounded-[var(--radius-panel)] border border-[var(--border-subtle)] p-6"
      action={formAction}
    >
      <h1 className="text-center text-xl font-bold">Sign-in as Admin</h1>
      <div className="mt-2 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm">
            E-mail
          </label>
          <input
            id="email"
            className="cms-input"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm">
            Password
          </label>
          <input
            id="password"
            className="cms-input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end">
        <button
          disabled={pending}
          className="rounded-[var(--radius-control)] bg-[var(--cms-surface)] px-6 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
          type="submit"
        >
          {pending ? "Signing in..." : "Sign-in"}
        </button>
      </div>
    </form>
  );
}
