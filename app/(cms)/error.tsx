"use client";

import Link from "next/link";
import { Notice } from "@/components/ui/notice";

/**
 * Error boundary for the CMS.
 *
 * Rendered inside the CMS shell (a segment's error file does not wrap that segment's own layout),
 * so the header and session controls stay available while the failure is reported.
 */
export default function CmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-5">
      <h1 className="text-lg font-bold">Something went wrong</h1>

      <Notice variant="error">
        The CMS could not complete that request. Your changes were not saved.
      </Notice>

      {error.digest ? (
        <p className="text-[10px] text-[var(--text-muted)]">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Try again
        </button>
        <Link
          href="/cms/products"
          className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Back to Product List
        </Link>
      </div>
    </section>
  );
}
