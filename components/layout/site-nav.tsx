import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/layout/mobile-nav";

const primaryNavItems = [
  { href: "/#features", label: "Features" },
  { href: "/products", label: "Products" },
];

const accountItem = { href: "/cms/login", label: "Sign in" };

const ctaItem = { href: "/#contact", label: "Talk to an Expert" };

export function SiteNav() {
  return (
    <header className="relative border-b border-[var(--border-subtle)] bg-[var(--background)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1040px] items-center gap-6 px-6 lg:gap-12 lg:px-0">
        <Link href="/" className="shrink-0" aria-label="QUBE home">
          <Image src="/qube-logo.svg" alt="QUBE" width={99} height={32} priority />
        </Link>

        {/* Wide viewports keep the inline row. */}
        <nav
          className="hidden flex-1 items-center justify-end gap-6 lg:flex"
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
            href={accountItem.href}
            className="text-sm font-medium text-[var(--foreground)] transition-opacity hover:opacity-70"
          >
            {accountItem.label}
          </Link>
          <Link
            href={ctaItem.href}
            className="cta-gradient rounded-[var(--radius-control)] px-5 py-2 text-sm font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90"
          >
            {ctaItem.label}
          </Link>
        </nav>

        {/* Narrow viewports collapse instead of overflowing. */}
        <div className="ml-auto lg:hidden">
          <MobileNav
            items={primaryNavItems}
            accountItem={accountItem}
            cta={ctaItem}
          />
        </div>
      </div>
    </header>
  );
}
