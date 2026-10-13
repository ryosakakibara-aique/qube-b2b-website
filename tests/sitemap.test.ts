import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "../lib/site.ts";

/**
 * The sitemap's freshness signal, and the fact that it can be built at all.
 *
 * Two defects lived here. Every entry was stamped with `new Date()` on every run, which made
 * `lastModified` say "this changed just now" forever and therefore say nothing — a real content edit
 * was indistinguishable from a rebuild, and crawlers learn to ignore a `lastmod` that always moves.
 * The second is the shape of the fix: the route is a Next route module, so it cannot be imported by
 * the test runner, and the interesting logic has to be reachable from a plain test.
 *
 * The behaviour itself is covered in `seo-dates.test.ts`; this file pins the wiring, so the two
 * cannot drift apart.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const source = read("app/sitemap.ts");

test("lastModified comes from the records, not from the clock", () => {
  assert.match(
    source,
    /updatedAt/,
    "product entries must use the record's own updated_at; without it lastmod is a rebuild timestamp",
  );
  assert.match(source, /toLastModified/, "each product entry is dated through the shared helper");
  assert.match(
    source,
    /mostRecent/,
    "the listing routes render product content, so their lastmod is the newest product edit",
  );
  assert.ok(
    !/lastModified\s*=\s*new Date\(\)/.test(source),
    "stamping every entry with the build clock is the defect this replaced",
  );
  assert.ok(
    !/for \(const slug of|slugs\.data/.test(source),
    "the sitemap must read slug+timestamp entries, not bare slugs — otherwise the date has no source",
  );
});

test("the sitemap never publishes a URL it could not verify", () => {
  assert.match(
    source,
    /products\.ok/,
    "a failed catalogue read must be distinguished from an empty one",
  );
  assert.match(
    source,
    /console\.error/,
    "an omitted product URL is reported rather than silently dropped",
  );
  assert.match(
    source,
    /entriesForProducts/,
    "the product loop runs over an explicitly verified list",
  );
});

test("the two static routes are always present, and the CMS never is", () => {
  assert.match(source, /`\$\{siteUrl\}\/`/, "the homepage entry is unconditional");
  assert.match(source, /`\$\{siteUrl\}\/products`/, "the catalogue entry is unconditional");
  assert.ok(!/cms/.test(source), "the CMS is authenticated and belongs in neither sitemap nor index");
  assert.ok(!/\/cms\/login/.test(source), "the sign-in route must not be submitted for indexing");
});

test("the origin is the shared one, and cannot be a localhost fallback", () => {
  assert.match(source, /getSiteUrl/, "the sitemap must use the same origin resolver as every canonical");
  assert.ok(
    !/process\.env\.NEXT_PUBLIC_SITE_URL/.test(source),
    "reading the variable directly bypasses the production fallback",
  );
  assert.ok(!/localhost/.test(source), "the route must not carry its own origin floor");

  const url = new URL(getSiteUrl());
  assert.ok(url.protocol === "http:" || url.protocol === "https:");
});

test("the sitemap's revalidation does not outlive the catalogue's", () => {
  const sitemapRevalidate = Number(/export const revalidate = (\d+)/.exec(source)?.[1]);
  assert.ok(Number.isFinite(sitemapRevalidate), "the sitemap must declare a revalidation window");

  for (const route of [
    "app/(marketing)/page.tsx",
    "app/(marketing)/products/page.tsx",
    "app/(marketing)/products/[product]/page.tsx",
  ]) {
    const routeRevalidate = Number(/export const revalidate = (\d+)/.exec(read(route))?.[1]);
    assert.ok(
      sitemapRevalidate <= routeRevalidate,
      `${route} revalidates every ${routeRevalidate}s but the sitemap only every ${sitemapRevalidate}s, ` +
        "so the sitemap can advertise a catalogue older than the one the site serves",
    );
  }
});
