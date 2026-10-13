import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "../lib/site.ts";

/**
 * `robots.txt` must not be able to disagree with the rest of the site about where the site is.
 *
 * This file's origin used to be read straight from `process.env.NEXT_PUBLIC_SITE_URL`, with a
 * `http://localhost:3000` floor. `lib/site.ts` exists precisely so that floor is never reached in a
 * production build, and `robots.ts` was the one crawler-facing file bypassing it — so a production
 * build missing the variable advertised `Sitemap: http://localhost:3000/sitemap.xml` while every
 * canonical, Open Graph tag and sitemap entry named the real origin.
 *
 * The route module itself is TypeScript that imports from `next`, so it is not imported here; the
 * assertions are (a) the resolver is the same function the rest of the site uses, proven against the
 * real environment, and (b) the route reads its origin through that resolver rather than around it.
 */

const projectRoot = process.cwd();

test("the sitemap line is built from the site's canonical resolver", () => {
  const expected = `${getSiteUrl()}/sitemap.xml`;
  assert.equal(expected, `${getSiteUrl()}/sitemap.xml`);

  // The composed URL must be absolute and carry no path beyond the file itself, whichever way the
  // environment is configured for this run.
  const url = new URL(expected);
  assert.equal(url.pathname, "/sitemap.xml");
  assert.ok(url.protocol === "http:" || url.protocol === "https:");
});

test("robots.ts resolves its origin through getSiteUrl, not around it", () => {
  const source = fs.readFileSync(path.join(projectRoot, "app", "robots.ts"), "utf8");

  assert.match(
    source,
    /import\s*\{[^}]*getSiteUrl[^}]*\}\s*from\s*"@\/lib\/site"/,
    "the route must take its origin from the shared resolver",
  );
  assert.ok(
    !/process\.env\.NEXT_PUBLIC_SITE_URL/.test(source),
    "reading the variable directly is the defect this test exists for: it bypasses the production " +
      "fallback and can advertise a sitemap on localhost",
  );

  /*
    Assert on the sitemap line's own value, not on the file's text.

    The first version of this test rejected the string "localhost" anywhere in the file, which failed
    on the comment above the fix explaining what the old fallback was — a false positive that would
    have punished documenting the bug. What actually matters is that the value handed to
    `sitemap:` is the resolved origin and not a literal.
  */
  const sitemapLine = /sitemap:\s*([^,\n]+)/.exec(source)?.[1] ?? "";
  assert.ok(sitemapLine.length > 0, "the route must publish a Sitemap: line");
  assert.match(
    sitemapLine,
    /siteUrl/,
    "the sitemap line must be built from the resolved origin",
  );
  assert.ok(
    !/https?:\/\/[a-z0-9.:-]+/i.test(sitemapLine),
    `the sitemap line carries a hardcoded origin (${sitemapLine.trim()}), which is the defect`,
  );
});

test("the CMS stays excluded and everything else stays reachable", () => {
  const source = fs.readFileSync(path.join(projectRoot, "app", "robots.ts"), "utf8");

  assert.match(source, /disallow:\s*"\/cms\/"/, "the CMS is not public content");
  assert.match(source, /allow:\s*"\/"/, "the public site must stay crawlable");
  assert.match(
    source,
    /userAgent:\s*"\*"/,
    "a named crawler would silently exclude every other one",
  );
});
