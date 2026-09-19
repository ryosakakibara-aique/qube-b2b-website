import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_SELECT,
  countProducts,
  fetchProductBySlug,
  fetchProducts,
  isUniqueViolation,
  mapProduct,
} from "../lib/products/repository.ts";
import { createFakeSupabase, productRow } from "./helpers/fake-supabase.ts";

/**
 * Mapping, query construction and error propagation for the data layer.
 *
 * `tsc` cannot check any of this against an untyped Supabase client, and a live database is not
 * available, so the query the code builds is asserted directly.
 */

test("maps a row to the domain shape", () => {
  const product = mapProduct(productRow);

  assert.equal(product.id, productRow.id);
  assert.equal(product.title, "PANDORA 3.0");
  assert.equal(product.slug, "pandora");
  assert.deepEqual(product.tags, ["smart locker", "enterprise"]);
  assert.equal(product.imageUrl, "https://example.test/hero.png");
  assert.equal(product.imageAlt, "A QUBE locker");
  assert.equal(product.ctaLabel, "Talk to an Expert");
  assert.equal(product.published, true);
  assert.equal(product.updatedAt, "2026-01-02T03:04:05.000Z");
});

test("orders sections and their images regardless of response order", () => {
  const product = mapProduct(productRow);

  assert.deepEqual(
    product.contentSections.map((section) => section.heading),
    ["WASH", "DROP"],
  );
  assert.deepEqual(
    product.contentSections[0].images.map((image) => image.alt),
    ["Wash one", "Wash two"],
  );
});

test("tolerates null columns without inventing values", () => {
  const product = mapProduct({
    ...productRow,
    tags: null,
    image_url: null,
    image_alt: null,
    product_content_sections: null,
  });

  assert.deepEqual(product.tags, []);
  assert.equal(product.imageUrl, undefined);
  assert.equal(product.imageAlt, undefined);
  assert.deepEqual(product.contentSections, []);
});

test("treats a null image alt as an empty string rather than dropping the image", () => {
  const product = mapProduct({
    ...productRow,
    product_content_sections: [
      {
        id: "s1",
        sort_order: 1,
        heading: "WASH",
        body: "Body",
        product_content_section_images: [
          { sort_order: 1, url: "https://example.test/a.png", alt: null },
        ],
      },
    ],
  });

  assert.deepEqual(product.contentSections[0].images, [
    { url: "https://example.test/a.png", alt: "" },
  ]);
});

test("does not mutate the row it maps", () => {
  const sections = productRow.product_content_sections;
  const orderBefore = sections.map((section) => section.sort_order);
  mapProduct(productRow);
  assert.deepEqual(
    sections.map((section) => section.sort_order),
    orderBefore,
    "mapping must not sort the source array in place",
  );
});

test("a list read selects every mapped column, orders by title and asks for no count", () => {
  const { client, queries } = createFakeSupabase({ rows: [productRow] });
  return fetchProducts(client, { publishedOnly: false }).then((products) => {
    assert.equal(queries.length, 1);
    const query = queries[0];
    assert.equal(query.table, "products");
    assert.equal(query.columns, PRODUCT_SELECT);
    assert.deepEqual(query.order, { column: "title", ascending: true });
    assert.deepEqual(query.filters, []);
    assert.equal(query.countRequested, null, "a list read must not pay for COUNT(*)");
    assert.equal(query.head, false);
    assert.equal(products.length, 1);
  });
});

test("a published-only read filters on the publication flag", async () => {
  const { client, queries } = createFakeSupabase({ rows: [] });
  await fetchProducts(client, { publishedOnly: true });
  assert.deepEqual(queries[0].filters, [["published", true]]);
});

test("paging uses an inclusive range derived from limit and offset", async () => {
  const { client, queries } = createFakeSupabase({ rows: [] });

  await fetchProducts(client, { publishedOnly: false, limit: 8, offset: 0 });
  assert.deepEqual(queries[0].range, [0, 7]);
  assert.equal(queries[0].limit, null);

  await fetchProducts(client, { publishedOnly: false, limit: 8, offset: 16 });
  assert.deepEqual(queries[1].range, [16, 23]);
});

test("a limit without an offset uses limit rather than range", async () => {
  const { client, queries } = createFakeSupabase({ rows: [] });
  await fetchProducts(client, { publishedOnly: false, limit: 6 });
  assert.equal(queries[0].limit, 6);
  assert.equal(queries[0].range, null);
});

test("an empty or missing result set becomes an empty list, not an error", async () => {
  const empty = createFakeSupabase({ rows: [] });
  assert.deepEqual(await fetchProducts(empty.client, { publishedOnly: false }), []);

  const missing = createFakeSupabase({ rows: null });
  assert.deepEqual(await fetchProducts(missing.client, { publishedOnly: false }), []);
});

test("a query error is thrown so callers can degrade deliberately", async () => {
  const { client } = createFakeSupabase({ error: { message: "boom" } });
  // PostgREST errors are plain objects, not Error instances, and are propagated as-is.
  await assert.rejects(
    () => fetchProducts(client, { publishedOnly: false }),
    (thrown: unknown) => {
      assert.deepEqual(thrown, { message: "boom" });
      return true;
    },
  );
});

test("counting is a head-only request for the id column", async () => {
  const { client, queries } = createFakeSupabase({ count: 23 });
  const total = await countProducts(client, { publishedOnly: false });

  assert.equal(total, 23);
  assert.equal(queries[0].columns, "id");
  assert.equal(queries[0].countRequested, "exact");
  assert.equal(queries[0].head, true);
  assert.equal(queries[0].range, null);
});

test("a missing count is reported as zero rather than null", async () => {
  const { client } = createFakeSupabase({ count: null });
  assert.equal(await countProducts(client, { publishedOnly: true }), 0);
});

test("counting propagates errors", async () => {
  const { client } = createFakeSupabase({ error: { message: "count failed" } });
  await assert.rejects(
    () => countProducts(client, { publishedOnly: false }),
    (thrown: unknown) => {
      assert.deepEqual(thrown, { message: "count failed" });
      return true;
    },
  );
});

test("a single read filters by slug and never throws on a missing row", async () => {
  const { client, queries } = createFakeSupabase({ single: null });
  const product = await fetchProductBySlug(client, "pandora", { publishedOnly: true });

  assert.equal(product, null);
  assert.equal(queries[0].table, "products");
  assert.equal(queries[0].maybeSingle, true);
  assert.deepEqual(queries[0].filters, [
    ["slug", "pandora"],
    ["published", true],
  ]);
});

test("a single read omits the publication filter for staff", async () => {
  const { client, queries } = createFakeSupabase({ single: productRow });
  await fetchProductBySlug(client, "pandora", { publishedOnly: false });
  assert.deepEqual(queries[0].filters, [["slug", "pandora"]]);
});

test("a single read maps the row it finds", async () => {
  const { client } = createFakeSupabase({ single: productRow });
  const product = await fetchProductBySlug(client, "pandora", { publishedOnly: false });
  assert.equal(product?.title, "PANDORA 3.0");
  assert.equal(product?.contentSections.length, 2);
});

test("recognises only a Postgres unique violation", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation({ code: "23503" }), false);
  assert.equal(isUniqueViolation({ code: undefined }), false);
  assert.equal(isUniqueViolation(null), false);
});
