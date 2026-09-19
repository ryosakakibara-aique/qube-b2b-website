"use client";

import { useActionState } from "react";
import { setProductPublished } from "@/lib/products/actions";

/**
 * Publication switch for a product row.
 *
 * A real `switch` control backed by a server action, replacing the decorative span pair that
 * looked interactive but had no behaviour, no label and no keyboard access.
 */
export function PublishToggle({
  id,
  slug,
  published,
  title,
}: {
  id: string;
  slug: string;
  published: boolean;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(setProductPublished, {});
  const label = published
    ? `Unpublish ${title}`
    : `Publish ${title}`;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <button
        type="submit"
        role="switch"
        aria-checked={published}
        aria-label={label}
        disabled={pending}
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 ${
          published ? "bg-[var(--cms-surface)]" : "bg-[var(--surface-muted)]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            published ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
      {state.error ? (
        <span role="alert" className="text-[10px] text-red-700">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span role="status" className="text-[10px] text-[var(--text-muted)]">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
