import { test } from "node:test";
import assert from "node:assert/strict";
import { mostRecent, toLastModified } from "../lib/seo/dates.ts";

/**
 * `lastModified` has to mean something.
 *
 * The sitemap used to stamp every entry with `new Date()` on every run, which made the signal
 * worthless in both directions: a genuine content edit was indistinguishable from a rebuild, and a
 * crawler that learns to ignore `lastmod` will ignore it on the pages where it is real. The other
 * failure mode is worse than a weak signal — `new Date("garbage")` is an invalid Date, which
 * serialises into the sitemap as a value no crawler can parse.
 */

const NOW = new Date("2026-03-01T12:00:00.000Z");
const BUILD = new Date("2026-02-01T00:00:00.000Z");

test("a stored timestamp is used as given", () => {
  const value = toLastModified("2026-01-15T08:30:00.000Z", NOW, BUILD);
  assert.equal(value.toISOString(), "2026-01-15T08:30:00.000Z");
});

test("a missing timestamp falls back instead of emitting an invalid date", () => {
  assert.equal(toLastModified(undefined, NOW, BUILD).toISOString(), BUILD.toISOString());
  assert.equal(toLastModified("", NOW, BUILD).toISOString(), BUILD.toISOString());
});

test("an unparseable timestamp falls back rather than poisoning the sitemap", () => {
  for (const junk of ["not a date", "2026-13-45", "  ", "NaN"]) {
    const value = toLastModified(junk, NOW, BUILD);
    assert.ok(
      !Number.isNaN(value.getTime()),
      `"${junk}" produced an invalid Date, which serialises as unreadable XML`,
    );
    assert.equal(value.toISOString(), BUILD.toISOString());
  }
});

test("a future timestamp is clamped to now", () => {
  const value = toLastModified("2027-01-01T00:00:00.000Z", NOW, BUILD);
  assert.equal(
    value.toISOString(),
    NOW.toISOString(),
    "clock skew must not let the site claim content changed in the future",
  );
});

test("the listing date is the newest product edit", () => {
  const value = mostRecent(
    ["2026-01-01T00:00:00.000Z", "2026-02-20T00:00:00.000Z", "2025-12-31T00:00:00.000Z"],
    NOW,
    BUILD,
  );
  assert.equal(value.toISOString(), "2026-02-20T00:00:00.000Z");
});

test("an empty or unusable catalogue falls back to the build time", () => {
  assert.equal(mostRecent([], NOW, BUILD).toISOString(), BUILD.toISOString());
  assert.equal(
    mostRecent([undefined, "garbage"], NOW, BUILD).toISOString(),
    BUILD.toISOString(),
    "an unreadable catalogue must not become an unreadable date",
  );
});

test("a future record cannot drag the listing date forward either", () => {
  const value = mostRecent(["2027-06-01T00:00:00.000Z"], NOW, BUILD);
  assert.equal(value.toISOString(), NOW.toISOString());
});
