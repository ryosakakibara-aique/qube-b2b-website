import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCTION_SITE_URL,
  absoluteUrl,
  getSiteUrl,
  resolveSiteUrl,
} from "../lib/site.ts";

/**
 * Canonical origin resolution. The fallback must never silently apply in production, and a
 * malformed value must not crash the build.
 */

function withSiteUrl(value: string | undefined, run: () => void) {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

test("falls back to localhost when the origin is not configured", () => {
  withSiteUrl(undefined, () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});

test("treats an empty or whitespace value as unset", () => {
  withSiteUrl("   ", () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});

test("returns the origin without any trailing path", () => {
  withSiteUrl("https://business.qubesmartlockers.com/some/path", () => {
    assert.equal(getSiteUrl(), "https://business.qubesmartlockers.com");
  });
});

test("normalises a trailing slash", () => {
  withSiteUrl("https://business.qubesmartlockers.com/", () => {
    assert.equal(getSiteUrl(), "https://business.qubesmartlockers.com");
  });
});

test("keeps an explicit port", () => {
  withSiteUrl("http://localhost:43129", () => {
    assert.equal(getSiteUrl(), "http://localhost:43129");
  });
});

test("falls back rather than throwing on an invalid value", () => {
  withSiteUrl("not a url", () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});

test("builds absolute URLs for both forms of path", () => {
  withSiteUrl("https://example.test", () => {
    assert.equal(absoluteUrl("/products"), "https://example.test/products");
    assert.equal(absoluteUrl("products/pandora"), "https://example.test/products/pandora");
  });
});

/**
 * A production build without the variable must not canonicalise the whole site to localhost: that
 * would poison canonical URLs, Open Graph and the sitemap in one go.
 */
test("a production build without the variable uses the production origin", () => {
  assert.equal(resolveSiteUrl(undefined, true), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("", true), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("   ", true), PRODUCTION_SITE_URL);
});

test("an explicit value still wins in production, reduced to its origin", () => {
  assert.equal(
    resolveSiteUrl("https://staging.example.test/some/path", true),
    "https://staging.example.test",
  );
});

test("development keeps the localhost fallback", () => {
  assert.equal(resolveSiteUrl(undefined, false), "http://localhost:3000");
});

test("the production origin is https and carries no path", () => {
  const url = new URL(PRODUCTION_SITE_URL);
  assert.equal(url.protocol, "https:");
  assert.equal(url.pathname, "/");
});
