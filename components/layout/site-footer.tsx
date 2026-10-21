import Link from "next/link";
import Image from "next/image";

type FooterLink = { href: string; label: string };

/**
 * One list, one group.
 *
 * It used to be two: "Explore" held the navigation targets, "Account" held the CMS sign-in and the
 * sitemap. The client asked for the admin sign-in to be reachable only by typing its URL — closing
 * the SEO plan's G15/O3, since `/cms/login` is already `noindex` and disallowed in `robots.txt` — so
 * the CMS entry is gone and the sitemap moved in here rather than leaving a group with one orphan
 * link under a heading that no longer described it.
 *
 * The Figma footer frames were exported with outlined text, so the designed link labels are not
 * recoverable from the committed reference pack. Rather than ship placeholder link text, this renders
 * the navigation targets that actually exist. See docs/DEVELOPMENT-PHASES.md §1 (D2/D3).
 */
const footerLinks: FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/#features", label: "Built for every business" },
  { href: "/#contact", label: "Talk to an Expert" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

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
        <nav aria-label="Footer" className="text-xs">
          <div>
            {/*
              These are groups inside one footer navigation, not sections of the page. As `<h2>`
              they landed in the document outline at the same level as the page's own sections —
              "Explore" read as page structure to a screen reader and to anything that parses the
              outline, when it is only a label for a list of links.
            */}
            <h3 className="font-semibold">Explore</h3>
            <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
              {footerLinks.map((link) => (
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
