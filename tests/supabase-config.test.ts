import { test } from "node:test";
import assert from "node:assert/strict";
import { getSupabaseConfig, resolveSupabaseUrl } from "../lib/supabase/config.ts";

/**
 * Supabase URL resolution.
 *
 * This suite exists because the value in a real environment was the Data API URL
 * (`https://<ref>.supabase.co/rest/v1/`) rather than the project URL. The client accepts either and
 * then requests the wrong paths, so every read failed with an opaque PostgREST error and no crash to
 * point at the cause.
 */

const PROJECT = "https://project-ref.supabase.co";

test("accepts a bare project origin", () => {
  assert.equal(resolveSupabaseUrl(PROJECT), PROJECT);
});

test("discards a path, which is the mistake that actually happened", () => {
  assert.equal(resolveSupabaseUrl(`${PROJECT}/rest/v1/`), PROJECT);
  assert.equal(resolveSupabaseUrl(`${PROJECT}/rest/v1`), PROJECT);
  assert.equal(resolveSupabaseUrl(`${PROJECT}/auth/v1/`), PROJECT);
});

test("normalises a trailing slash and surrounding whitespace", () => {
  assert.equal(resolveSupabaseUrl(`${PROJECT}/`), PROJECT);
  assert.equal(resolveSupabaseUrl(`  ${PROJECT}  `), PROJECT);
  assert.equal(resolveSupabaseUrl(`\n${PROJECT}\t`), PROJECT);
});

test("keeps an explicit port, as local Supabase does", () => {
  assert.equal(resolveSupabaseUrl("http://127.0.0.1:54321"), "http://127.0.0.1:54321");
});

test("rejects missing and non-http values", () => {
  for (const value of [undefined, "", "   ", "not a url", "supabase.co", "ftp://example.test"]) {
    assert.equal(resolveSupabaseUrl(value), null, `wrongly accepted ${JSON.stringify(value)}`);
  }
});

test("resolves a complete configuration", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `${PROJECT}/rest/v1/`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  sb_publishable_test  ";

  try {
    assert.deepEqual(getSupabaseConfig(), { url: PROJECT, anonKey: "sb_publishable_test" });
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});

test("is unconfigured when either half is missing", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = PROJECT;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(getSupabaseConfig(), null);

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
    assert.equal(getSupabaseConfig(), null);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "not a url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
    assert.equal(getSupabaseConfig(), null);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
