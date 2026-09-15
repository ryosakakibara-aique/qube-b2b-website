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
          className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
