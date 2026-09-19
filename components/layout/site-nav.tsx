import Link from "next/link";
import Image from "next/image";

const primaryNavItems = [
  { href: "/#features", label: "Features" },
  { href: "/products", label: "Products" },
];

export function SiteNav() {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--background)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1040px] items-center gap-12 px-6 lg:px-0">
        <Link href="/" className="shrink-0" aria-label="QUBE home">
          <Image src="/qube-logo.svg" alt="QUBE" width={99} height={32} priority />
        </Link>
        <nav
          className="flex flex-1 items-center justify-end gap-6"
          aria-label="Primary navigation"
        >
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--foreground)] transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cms/login"
            className="text-sm font-medium text-[var(--foreground)] transition-opacity hover:opacity-70"
          >
            Sign in
          </Link>
          <Link
            href="/#contact"
            className="cta-gradient rounded-[var(--radius-control)] px-5 py-2 text-sm font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90"
          >
            Talk to an Expert
          </Link>
        </nav>
      </div>
    </header>
  );
}
