import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALTERNATE_NAMES,
  LEGAL_NAME,
  SAME_AS,
  breadcrumbNode,
  graph,
  itemListNode,
  organizationNode,
  productNode,
  webPageNode,
  websiteNode,
} from "../lib/seo/schema.ts";
import { SITE_NAME } from "../lib/site.ts";

/**
 * Structured data, and the rule that decides whether it may be published at all.
 *
 * The project forbids fabricated commercial facts. That rule cannot be enforced by a comment, so it
 * is enforced here: the check walks every node a builder produces — including nested objects and
 * arrays — and fails if a price, an offer, a rating or a review appears anywhere. Absence is a
 * requirement, not an oversight, and a future edit that adds an invented price has to delete a test
 * to do it.
 */

const SITE_URL = "https://business.qubesmartlockers.com";

/**
 * Keys that assert commercial facts the site does not have.
 *
 * `availability` and `priceValidUntil` are meaningless without `offers`, and `ratingValue`/
 * `reviewCount` are meaningless without `aggregateRating` — all four appear together or not at all,
 * so all four are listed.
 */
const FABRICATED_KEYS = [
  "offers",
  "price",
  "priceCurrency",
  "priceValidUntil",
  "availability",
  "aggregateRating",
  "ratingValue",
  "ratingCount",
  "reviewCount",
  "review",
];

/** Every key at every depth of a node, so a nested fabrication cannot hide. */
function allKeys(value: unknown, seen = new Set<unknown>()): string[] {
  if (value === null || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);

  if (Array.isArray(value)) return value.flatMap((entry) => allKeys(entry, seen));

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    key,
    ...allKeys(child, seen),
  ]);
}

function assertNoFabrication(label: string, node: unknown) {
  const keys = new Set(allKeys(node));
  for (const forbidden of FABRICATED_KEYS) {
    assert.ok(
      !keys.has(forbidden),
      `${label} carries "${forbidden}": the site has no such data, and inventing it is forbidden. ` +
        "If a real value now exists, add it deliberately and adjust this test.",
    );
  }
}

const product = {
  slug: "smart-parcel-lockers",
  title: "Smart Parcel Lockers",
  tags: ["Parcel Management", "Property Tech", "Secure Storage"],
};

test("no builder fabricates a commercial fact", () => {
  const built = [
    ["organization", organizationNode(SITE_URL)],
    ["website", websiteNode(SITE_URL)],
    ["webPage", webPageNode(SITE_URL, "/products", "Products", "A description")],
    ["itemList", itemListNode(SITE_URL, [product])],
    [
      "product",
      productNode(SITE_URL, product, {
        description: "Automate parcel receiving.",
        image: "https://example.test/hero.jpg",
      }),
    ],
    [
      "breadcrumb",
      breadcrumbNode(SITE_URL, [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
      ]),
    ],
  ] as const;

  for (const [label, node] of built) assertNoFabrication(label, node);

  // And the same rule across a whole assembled graph, which is what actually ships.
  assertNoFabrication("graph", graph(built.map(([, node]) => node)));
});

test("the brand has exactly one spelling, and the legal name is separate", () => {
  const organization = organizationNode(SITE_URL);
  const product_ = productNode(SITE_URL, product);

  assert.equal(organization.name, SITE_NAME, "the public brand must come from the shared constant");
  assert.equal(organization.legalName, LEGAL_NAME);
  assert.deepEqual(organization.alternateName, ALTERNATE_NAMES);

  /*
    The product's brand is a reference to the Organization node, not a second copy of the name. That
    is what stops `QUBE` and `QUBE Smart Lockers` reappearing as competing names for one entity —
    which is exactly how they disagreed before this module existed.
  */
  assert.deepEqual(product_.brand, { "@id": `${SITE_URL}/#organization` });
  assert.ok(
    !JSON.stringify(product_).includes("QUBE"),
    "the product node must not spell the brand itself; it points at the organization",
  );
});

test("profiles are the confirmed ones, emitted verbatim", () => {
  const organization = organizationNode(SITE_URL);

  assert.deepEqual(organization.sameAs, SAME_AS);
  assert.equal(SAME_AS.length, 3);
  for (const url of SAME_AS) {
    assert.doesNotThrow(() => new URL(url), `${url} is not a usable URL`);
    assert.match(url, /^https:\/\//, "a profile URL must be https");
  }
  assert.ok(
    SAME_AS.includes("https://www.qubesmartlockers.com/"),
    "the reachable brand host is the `www` form; the bare apex does not resolve",
  );
});

test("the nodes reference each other rather than repeating themselves", () => {
  const homepage = graph([
    organizationNode(SITE_URL),
    websiteNode(SITE_URL),
    webPageNode(SITE_URL, "/", SITE_NAME, "Site description"),
  ]);

  assert.equal(homepage["@context"], "https://schema.org");

  const ids = homepage["@graph"].map((node) => node["@id"]);
  assert.equal(new Set(ids).size, ids.length, "duplicate @id values make the graph ambiguous");

  const website = homepage["@graph"].find((node) => node["@type"] === "WebSite");
  assert.deepEqual(website?.publisher, { "@id": `${SITE_URL}/#organization` });

  const page = homepage["@graph"].find((node) => node["@type"] === "WebPage");
  assert.deepEqual(page?.isPartOf, { "@id": `${SITE_URL}/#website` });
  assert.deepEqual(page?.about, { "@id": `${SITE_URL}/#organization` });
});

test("every @id is absolute, so a crawler can resolve it", () => {
  const nodes = graph([
    organizationNode(SITE_URL),
    websiteNode(SITE_URL),
    webPageNode(SITE_URL, "/products", "Products", "A description"),
    itemListNode(SITE_URL, [product]),
    productNode(SITE_URL, product, { description: "Automated parcel handover." }),
    breadcrumbNode(SITE_URL, [
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
    ]),
  ])["@graph"];

  for (const node of nodes) {
    const id = node["@id"];
    assert.equal(typeof id, "string", `${node["@type"]} has no @id`);
    assert.match(String(id), /^https:\/\//, `${node["@type"]}'s @id is not absolute`);
  }
});

test("the item list describes the catalogue the page renders", () => {
  const empty = itemListNode(SITE_URL, []);
  assert.equal(empty.numberOfItems, 0);
  assert.deepEqual(empty.itemListElement, [], "an empty catalogue is an empty list, not a guess");

  const list = itemListNode(SITE_URL, [
    { slug: "a", title: "Product A" },
    { slug: "b", title: "Product B" },
  ]);
  assert.equal(list.numberOfItems, 2);

  const items = list.itemListElement as Array<Record<string, unknown>>;
  assert.deepEqual(
    items.map((item) => item.position),
    [1, 2],
    "schema.org positions are 1-based",
  );
  assert.equal(items[0].url, `${SITE_URL}/products/a`);
  assert.equal(items[1].name, "Product B");
});

test("a product node carries only what the record actually holds", () => {
  const bare = productNode(SITE_URL, { slug: "x", title: "X", tags: [] });

  assert.equal(bare.name, "X");
  assert.equal(bare.url, `${SITE_URL}/products/x`);
  assert.ok(!("description" in bare), "a missing description is omitted, never invented");
  assert.ok(!("image" in bare), "a missing image is omitted");
  assert.ok(!("category" in bare), "a product with no tags has no category");

  const full = productNode(SITE_URL, product, {
    description: "Automate parcel receiving.",
    image: "https://example.test/hero.jpg",
  });
  assert.deepEqual(full.category, product.tags, "tags are the product's own vocabulary");
  assert.equal(full.image, "https://example.test/hero.jpg");
});

test("the breadcrumb trail matches the visible one", () => {
  const node = breadcrumbNode(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Smart Parcel Lockers", path: "/products/smart-parcel-lockers" },
  ]);

  const items = node.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 3);
  assert.equal(items[0].item, `${SITE_URL}/`);
  assert.equal(items[2].name, "Smart Parcel Lockers");
  assert.equal(items[2].item, `${SITE_URL}/products/smart-parcel-lockers`);
});

test("an absent node is dropped rather than emitted empty", () => {
  assert.equal(graph([organizationNode(SITE_URL), null, undefined])["@graph"].length, 1);
});
