import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <Link
          href="/"
          className="cta-gradient mt-6 inline-flex rounded-[var(--radius-control)] px-6 py-3 text-sm font-bold text-[var(--brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
