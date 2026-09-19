import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTimestamp } from "../lib/format.ts";

/**
 * CMS timestamps. The zone is stated explicitly so an editor never has to guess which one a date is
 * in, and an unusable value must not render as "Invalid Date".
 */

test("formats a timestamp in UTC with the zone named", () => {
  assert.equal(formatTimestamp("2026-01-02T03:04:05.000Z"), "Jan 2, 2026, 3:04 AM UTC");
});

test("does not shift with the server's own timezone", () => {
  // The same instant must render identically wherever the server happens to run.
  assert.equal(formatTimestamp("2026-07-04T23:30:00.000Z"), "Jul 4, 2026, 11:30 PM UTC");
});

test("returns a readable placeholder for unusable values", () => {
  assert.equal(formatTimestamp(""), "Unknown");
  assert.equal(formatTimestamp("not a date"), "Unknown");
});
