import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SECTION_COUNT,
  MAX_TAG_COUNT,
  LONG_CONTENT_LIMIT,
  SHORT_CONTENT_LIMIT,
  parseProductForm,
} from "../lib/products/validation.ts";

/**
 * The validation layer is the only guard between the CMS form and the database, and it is pure —
 * so it is the one piece of the Phase 3 slice that can be proven without a live Supabase project.
 */

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function minimal(overrides: Record<string, string> = {}) {
  return form({
    title: "Parcel Locker",
    slug: "parcel-locker",
    description: "Reliable last-mile storage.",
    sectionCount: "0",
    ...overrides,
  });
}

function expectOk(result: ReturnType<typeof parseProductForm>) {
  assert.equal(result.ok, true, `expected a valid payload, got ${JSON.stringify(result)}`);
  if (!result.ok) throw new Error("unreachable");
  return result.payload;
}

function expectErrors(result: ReturnType<typeof parseProductForm>) {
  assert.equal(result.ok, false, "expected validation to fail");
  if (result.ok) throw new Error("unreachable");
  return result.fieldErrors;
}

test("accepts a minimal product and defaults to a draft", () => {
  const payload = expectOk(parseProductForm(minimal()));
  assert.equal(payload.title, "Parcel Locker");
  assert.equal(payload.slug, "parcel-locker");
  assert.equal(payload.published, false);
  assert.equal(payload.id, null);
  assert.deepEqual(payload.tags, []);
  assert.deepEqual(payload.sections, []);
  assert.equal(payload.imageUrl, null);
});

test("reads the id and publication flag when present", () => {
  const payload = expectOk(
    parseProductForm(minimal({ id: "11111111-1111-4111-8111-111111111111", published: "true" })),
  );
  assert.equal(payload.id, "11111111-1111-4111-8111-111111111111");
  assert.equal(payload.published, true);
});

test("requires title, path and description", () => {
  const errors = expectErrors(parseProductForm(form({ sectionCount: "0" })));
  assert.ok(errors.title, "title error expected");
  assert.ok(errors.slug, "slug error expected");
  assert.ok(errors.description, "description error expected");
});

test("treats whitespace-only values as missing", () => {
  const errors = expectErrors(
    parseProductForm(form({ title: "   ", slug: "  ", description: "  ", sectionCount: "0" })),
  );
  assert.ok(errors.title);
  assert.ok(errors.slug);
  assert.ok(errors.description);
});

test("normalises the slug to lower case", () => {
  const payload = expectOk(parseProductForm(minimal({ slug: "Parcel-Locker" })));
  assert.equal(payload.slug, "parcel-locker");
});

test("rejects slugs that are not clean URL segments", () => {
  for (const slug of ["has spaces", "trailing-", "-leading", "under_score", "double--hyphen", "sl/ash", "café"]) {
    const errors = expectErrors(parseProductForm(minimal({ slug })));
    assert.ok(errors.slug, `expected "${slug}" to be rejected`);
  }
});

test("accepts slugs with numbers and single hyphens", () => {
  const payload = expectOk(parseProductForm(minimal({ slug: "pandora-3-0" })));
  assert.equal(payload.slug, "pandora-3-0");
});

test("splits, trims and de-duplicates tags", () => {
  const payload = expectOk(
    parseProductForm(minimal({ tags: " alpha , beta ,alpha,  , gamma " })),
  );
  assert.deepEqual(payload.tags, ["alpha", "beta", "gamma"]);
});

test("rejects more tags than the limit", () => {
  const tags = Array.from({ length: MAX_TAG_COUNT + 1 }, (_, i) => `tag-${i}`).join(",");
  const errors = expectErrors(parseProductForm(minimal({ tags })));
  assert.ok(errors.tags);
});

test("requires alt text for the product image", () => {
  const errors = expectErrors(
    parseProductForm(minimal({ imageUrl: "https://example.test/a.png" })),
  );
  assert.ok(errors.imageAlt);
});

test("keeps the product image and its alt text together", () => {
  const payload = expectOk(
    parseProductForm(
      minimal({
        imageUrl: "https://example.test/a.png",
        imageAlt: "A QUBE locker in a lobby",
      }),
    ),
  );
  assert.equal(payload.imageUrl, "https://example.test/a.png");
  assert.equal(payload.imageAlt, "A QUBE locker in a lobby");
});

test("bounds the long content block at its documented limit", () => {
  const atLimit = expectOk(
    parseProductForm(
      minimal({
        sectionCount: "1",
        content1Heading: "WASH",
        content1Body: "x".repeat(LONG_CONTENT_LIMIT),
      }),
    ),
  );
  assert.equal(atLimit.sections.length, 1);

  const errors = expectErrors(
    parseProductForm(
      minimal({ sectionCount: "1", content1Body: "x".repeat(LONG_CONTENT_LIMIT + 1) }),
    ),
  );
  assert.ok(errors.content1Body);
});

test("bounds later content blocks at the short limit", () => {
  const ok = expectOk(
    parseProductForm(
      minimal({ sectionCount: "2", content2Body: "x".repeat(SHORT_CONTENT_LIMIT) }),
    ),
  );
  assert.equal(ok.sections.length, 1);

  const errors = expectErrors(
    parseProductForm(
      minimal({ sectionCount: "2", content2Body: "x".repeat(SHORT_CONTENT_LIMIT + 1) }),
    ),
  );
  assert.ok(errors.content2Body);
});

test("gives every content block two image slots", () => {
  const payload = expectOk(
    parseProductForm(
      minimal({
        sectionCount: "2",
        content1Heading: "WASH",
        content1Image1Url: "https://example.test/1.png",
        content1Image1Alt: "First",
        content1Image2Url: "https://example.test/2.png",
        content1Image2Alt: "Second",
        content2Heading: "DROP",
        content2Image1Url: "https://example.test/3.png",
        content2Image1Alt: "Third",
        content2Image2Url: "https://example.test/4.png",
        content2Image2Alt: "Fourth",
      }),
    ),
  );

  assert.equal(payload.sections[0].images.length, 2);
  assert.deepEqual(payload.sections[0].images[0], {
    url: "https://example.test/1.png",
    alt: "First",
  });
  assert.deepEqual(
    payload.sections[1].images,
    [
      { url: "https://example.test/3.png", alt: "Third" },
      { url: "https://example.test/4.png", alt: "Fourth" },
    ],
    "a block other than the first must accept a second image: the per-position limit is gone",
  );
});

test("a later block's second image is validated like any other", () => {
  const errors = expectErrors(
    parseProductForm(
      minimal({ sectionCount: "2", content2Image2Url: "https://example.test/4.png" }),
    ),
  );

  assert.ok(
    errors.content2Image2Alt,
    "an image on the second slot of the second block still needs its description",
  );
});

test("rejects alt text without an uploaded image", () => {
  const errors = expectErrors(
    parseProductForm(minimal({ sectionCount: "1", content1Heading: "WASH", content1Image1Alt: "Orphan" })),
  );
  assert.ok(errors.content1Image1Alt);
});

test("drops content blocks that are entirely empty", () => {
  const payload = expectOk(
    parseProductForm(minimal({ sectionCount: "3", content2Heading: "Only the second" })),
  );
  assert.equal(payload.sections.length, 1);
  assert.equal(payload.sections[0].heading, "Only the second");
});

test("clamps an out-of-range section count instead of failing", () => {
  const zero = expectOk(parseProductForm(minimal({ sectionCount: "0" })));
  assert.deepEqual(zero.sections, []);

  const missing = expectOk(parseProductForm(form({ title: "T", slug: "t", description: "D" })));
  assert.deepEqual(missing.sections, []);

  const negative = expectOk(parseProductForm(minimal({ sectionCount: "-4" })));
  assert.deepEqual(negative.sections, []);

  const huge = expectOk(parseProductForm(minimal({ sectionCount: "999" })));
  assert.equal(huge.sections.length, 0);

  const nonNumeric = expectOk(parseProductForm(minimal({ sectionCount: "many" })));
  assert.deepEqual(nonNumeric.sections, []);
});

test("accepts the maximum number of content sections", () => {
  const entries: Record<string, string> = { sectionCount: String(MAX_SECTION_COUNT) };
  for (let index = 1; index <= MAX_SECTION_COUNT; index += 1) {
    entries[`content${index}Heading`] = `Section ${index}`;
  }
  const payload = expectOk(parseProductForm(minimal(entries)));
  assert.equal(payload.sections.length, MAX_SECTION_COUNT);
});

test("collects every field error at once rather than failing fast", () => {
  const errors = expectErrors(
    parseProductForm(
      form({
        title: "",
        slug: "bad slug",
        description: "",
        sectionCount: "1",
        content1Body: "x".repeat(LONG_CONTENT_LIMIT + 1),
      }),
    ),
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "content1Body",
    "description",
    "slug",
    "title",
  ]);
});
