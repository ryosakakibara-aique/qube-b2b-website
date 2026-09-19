import { SiteNav } from "@/components/layout/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for a product detail page.
 *
 * The site navigation is part of the page rather than a layout in this route group, so it is
 * rendered here too — otherwise the header would disappear and reappear around every load.
 */
export default function ProductLoading() {
  return (
    <main className="min-h-screen space-y-6 overflow-hidden bg-[var(--background)] text-[var(--heading)]">
      <SiteNav />

      <div role="status" aria-live="polite">
        <span className="sr-only">Loading product details</span>

        <section className="mx-auto w-full max-w-[1040px] px-6 py-4 lg:px-0">
          <Skeleton className="h-5 w-56" />
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <Skeleton className="h-14 w-full max-w-[420px]" />
              <div className="mt-16 flex gap-10">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1040px] px-6 py-10 lg:px-0">
          <Skeleton className="h-[300px] w-full lg:h-[408px]" />
        </section>

        <section className="mx-auto w-full max-w-[1040px] px-6 py-10 lg:px-0 lg:py-28">
          <Skeleton className="h-9 w-2/3 max-w-[620px]" />
          <div className="mt-6 max-w-[620px] space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
