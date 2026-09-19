import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for the CMS screens. Rendered inside the CMS shell, so the header stays put while
 * the page streams in.
 */
export default function CmsLoading() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-[28px] border border-[var(--border-subtle)] px-6 py-6"
    >
      <span className="sr-only">Loading CMS content</span>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="mt-8 min-h-[512px] rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)] p-4">
        <Skeleton className="h-6 w-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 px-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </section>
  );
}
