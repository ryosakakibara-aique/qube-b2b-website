import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The CMS entry point is not advertised.
 *
 * The client asked for the admin sign-in to be reachable only by typing its URL, which also closes the
 * SEO plan's open item G15/O3: `/cms/login` is `noindex` and disallowed in `robots.txt`, so a public
 * link only spent crawl budget and internal link equity on a page customers cannot use.
 *
 * Hiding a link is **cosmetic, not protective** — the page still answers 200 and the gate is
 * `profiles.approved` plus `current_user_role()` and RLS. These checks exist because the failure mode
 * is quiet: a later "helpful" redesign adds a Sign in link back to the navbar, nothing breaks, and the
 * decision is silently undone.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

/**
 * Source with comments removed.
 *
 * The files that implement this decision also *explain* it, and the explanation names `/cms/login` —
 * scanning raw source would fail on the documentation of the rule rather than on a link. The same
 * false positive once made `tests/robots.test.ts` fail on the word "localhost" in its own comment.
 */
function markupOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Everything that renders public chrome, plus the marketing routes themselves. */
const PUBLIC_CHROME = [
  "components/layout/site-nav.tsx",
  "components/layout/mobile-nav.tsx",
  "components/layout/site-footer.tsx",
  "app/(marketing)/page.tsx",
  "app/(marketing)/products/page.tsx",
  "app/(marketing)/products/[product]/page.tsx",
];

test("no public chrome links to the CMS", () => {
  for (const file of PUBLIC_CHROME) {
    const source = markupOnly(read(file));

    for (const needle of ["/cms/login", "/cms/products", "CMS sign in", "Sign in"]) {
      assert.ok(
        !source.includes(needle),
        `${file} mentions "${needle}". The admin sign-in is deliberately URL-only: staff bookmark it, ` +
          "and the public chrome keeps no door to it.",
      );
    }
  }
});

test("the collapsed mobile menu takes no account link", () => {
  const source = read("components/layout/mobile-nav.tsx");

  assert.ok(
    !source.includes("accountItem"),
    "the prop is gone rather than optional: an optional account link is a link that comes back",
  );
  assert.match(
    source,
    /\{items\.map\(\(item\) => \(/,
    "the panel renders the primary items only, plus the CTA below them",
  );
});

test("the footer is one list, and the sitemap lives in it", () => {
  const source = read("components/layout/site-footer.tsx");

  assert.match(
    source,
    /const footerLinks: FooterLink\[\] = \[/,
    "one list: the CMS link left and the sitemap moved in, rather than an Account group holding a " +
      "single orphan link",
  );
  assert.ok(
    source.includes('href: "/sitemap.xml"'),
    "the sitemap entry is kept — it is the only remaining machine-facing link in the footer",
  );
  assert.equal(
    [...source.matchAll(/<h3/g)].length,
    1,
    "one group, one heading",
  );
  assert.ok(
    source.includes('aria-label="Footer"'),
    "the landmark and its name survive the restructure",
  );
});

test("the sign-in page still exists and is still reachable by URL", () => {
  // The whole point of the decision: no link, but the route must keep working for staff.
  assert.ok(
    fs.existsSync(path.join(projectRoot, "app/(auth)/cms/login/page.tsx")),
    "removing the links must not remove the route",
  );

  const proxy = read("proxy.ts");
  assert.match(
    proxy,
    /LOGIN_PATH = "\/cms\/login"/,
    "the request proxy redirects unauthenticated CMS traffic here; if this drifts, the redirect and " +
      "this page would disagree",
  );

  const audit = read("scripts/audit-seo.mjs");
  assert.match(
    audit,
    /auditRoute\("\/cms\/login"/,
    "the SEO audit checks that this page answers 200 and is not indexable — keep it in the suite",
  );
});

test("the CMS keeps its way out", () => {
  const header = read("components/cms/cms-header.tsx");

  assert.ok(
    header.includes("signOut"),
    "staff who sign in need a sign-out control; removing the public entry must not strand them",
  );
});
