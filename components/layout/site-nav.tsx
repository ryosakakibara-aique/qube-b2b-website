import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/layout/mobile-nav";

const primaryNavItems = [
  { href: "/#features", label: "Features" },
  { href: "/products", label: "Products" },
];

const ctaItem = { href: "/#contact", label: "Talk to an Expert" };

/**
 * The public navigation.
 *
 * **There is deliberately no CMS link here** — not in the wide row and not in the collapsed panel.
 * The client asked for the admin sign-in to be reachable only by typing its URL, which also closes
 * the SEO plan's open item G15/O3: `/cms/login` is already `noindex` and disallowed in `robots.txt`,
 * so a public link only spent crawl budget and internal link equity on a page customers cannot use.
 *
 * That is cosmetic, not protective. The gate is `profiles.approved` plus `current_user_role()` and
 * RLS in the database. Staff reach the CMS from a bookmark, and `tests/cms-entry.test.ts` fails if a
 * link finds its way back into the public chrome.
 */
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
            href={ctaItem.href}
            className="cta-gradient rounded-[var(--radius-control)] px-5 py-2 text-sm font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90"
          >
            {ctaItem.label}
          </Link>
        </nav>

        {/* Narrow viewports collapse instead of overflowing. */}
        <div className="ml-auto lg:hidden">
          <MobileNav items={primaryNavItems} cta={ctaItem} />
        </div>
      </div>
    </header>
  );
}
