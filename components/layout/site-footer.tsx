import Link from "next/link";
import Image from "next/image";

type FooterLink = { href: string; label: string };

const exploreLinks: FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/#features", label: "Built for every business" },
  { href: "/#contact", label: "Talk to an Expert" },
];

const accountLinks: FooterLink[] = [
  { href: "/cms/login", label: "CMS sign in" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

/**
 * Shared public footer.
 *
 * The Figma footer frames were exported with outlined text, so the designed link labels are not
 * recoverable from the committed reference pack. Rather than ship placeholder link text, this
 * renders the navigation targets that are actually known to exist. See
 * docs/DEVELOPMENT-PHASES.md §1 (D2/D3) — replace these labels once the frames are re-exported.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-12">
      <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-6 lg:grid-cols-[1fr_2fr] lg:px-0">
        <div>
          <Image src="/qube-logo.svg" alt="QUBE" width={99} height={32} />
          <p className="mt-4 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
            A precise structural object representing the infrastructure for an
            enterprise-ready locker system.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <h2 className="font-semibold">Explore</h2>
            <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">Account</h2>
            <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </footer>
  );
}
