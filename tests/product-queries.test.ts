import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPublishedProductBySlug,
  getPublishedProductSlugs,
  getPublishedProducts,
} from "../lib/products/queries.ts";
import { getSupabasePublicClient } from "../lib/supabase/public.ts";

/**
 * Public read semantics. The most important property here is negative: when the catalogue cannot be
 * read, these functions must report it rather than substitute fabricated content.
 */

const NOT_CONFIGURED = "The product catalogue is not connected in this environment.";

function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return run().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const unconfigured = {
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
};

test("an unconfigured environment is reported, not faked", async () => {
  await withEnv(unconfigured, async () => {
    const result = await getPublishedProducts();
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, NOT_CONFIGURED);
  });
});

test("a malformed project URL degrades instead of throwing", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    },
    async () => {
      // The client factory must fail soft: a bad value in the environment cannot be allowed to
      // turn every public route into a 500.
      assert.doesNotThrow(() => getSupabasePublicClient());
      const result = await getPublishedProducts();
      assert.equal(result.ok, false);
    },
  );
});

test("a half-configured environment counts as unconfigured", async () => {
  await withEnv(
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined },
    async () => {
      const result = await getPublishedProducts();
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.error, NOT_CONFIGURED);
    },
  );
});

test("a missing product read reports the same honest failure", async () => {
  await withEnv(unconfigured, async () => {
    const result = await getPublishedProductBySlug("pandora");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, NOT_CONFIGURED);
  });
});

test("sitemap slug lookup propagates failure instead of returning an empty list", async () => {
  await withEnv(unconfigured, async () => {
    const result = await getPublishedProductSlugs();
    assert.equal(result.ok, false, "an empty list would silently publish a sitemap with no products");
  });
});
