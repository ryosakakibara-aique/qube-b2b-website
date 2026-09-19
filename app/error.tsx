"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          This page could not be loaded
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Please try again. If the problem continues, contact the site
          administrator.
        </p>
        {error.digest ? (
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-[var(--radius-control)] bg-[var(--surface-dark)] px-5 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Try again
          </button>
          <Link href="/" className="text-sm underline">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
