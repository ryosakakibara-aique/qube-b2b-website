import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CARD_TAG_LIMIT, selectTags } from "../lib/products/tags.ts";
import { MAX_TAG_COUNT } from "../lib/products/validation.ts";

/**
 * The product tag chip.
 *
 * Tags used to be drawn twice, by two chips that agreed on nothing: the carousel's had an 8px radius,
 * a translucent brand-gradient fill and gradient-clipped text written in hex literals, the product
 * page's was a pill with a `--brand-3` outline and `--brand-ink` text. The overflow rule was a bare
 * `slice(0, 3)` — a product could carry twelve tags (the CMS limit) and silently lose nine of them.
 *
 * The overflow arithmetic is tested for real, from the module the component imports; the chip's
 * markup is checked statically, because it renders JSX and Node's test runner cannot import that.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const CHIP = "components/products/product-tags.tsx";
const CAROUSEL = "components/products/product-carousel.tsx";
const PAGE = "app/(marketing)/products/[product]/page.tsx";
const RULE = "lib/products/tags.ts";

test("a card draws its limit and counts the rest", () => {
  const tags = ["a", "b", "c", "d", "e", "f", "g", "h"];

  assert.deepEqual(selectTags(tags, CARD_TAG_LIMIT), {
    shown: ["a", "b", "c"],
    hidden: 5,
  });
});

test("nothing is hidden at or below the limit", () => {
  for (const count of [0, 1, 2, 3]) {
    const tags = Array.from({ length: count }, (_, i) => `tag-${i}`);
    const { shown, hidden } = selectTags(tags, CARD_TAG_LIMIT);

    assert.equal(hidden, 0, `${count} tags must not produce an overflow chip`);
    assert.equal(shown.length, count);
  }
});

test("a page shows every tag", () => {
  const tags = Array.from({ length: MAX_TAG_COUNT }, (_, i) => `tag-${i}`);

  assert.deepEqual(selectTags(tags), { shown: tags, hidden: 0 });
});

test("order is preserved, because the first tags are the ones a visitor sees", () => {
  const tags = ["zebra", "alpha", "middle", "beta"];

  assert.deepEqual(selectTags(tags, 2).shown, ["zebra", "alpha"]);
});

test("the limit can never be the whole store, or the overflow chip would never appear", () => {
  assert.ok(
    CARD_TAG_LIMIT < MAX_TAG_COUNT,
    `a card shows ${CARD_TAG_LIMIT} of the ${MAX_TAG_COUNT} tags the CMS accepts; if those ever ` +
      `meet, the "+n" chip is dead code`,
  );
  assert.ok(CARD_TAG_LIMIT > 0, "a card has to show at least one tag");
});

test("both places that show tags render the shared chip", () => {
  const carousel = read(CAROUSEL);
  const page = read(PAGE);

  assert.match(
    carousel,
    /<ProductTags[\s\S]{0,200}variant="card"[\s\S]{0,200}tier=\{tier\}[\s\S]{0,200}limit=\{CARD_TAG_LIMIT\}/,
    "the carousel has to hand the chip its tier, or the chip cannot scale with the card, and its " +
      "limit, or the overflow rule never runs",
  );
  assert.match(
    page,
    /<ProductTags[\s\S]{0,200}variant="page"/,
    "the product page renders the shared chip as the page variant",
  );
  assert.ok(
    !/limit=/.test(page),
    "the page shows every tag: passing a limit there would hide tags the CMS stored",
  );
});

test("neither call site draws a chip of its own any more", () => {
  const invented = [
    "bg-clip-text", // the gradient-clipped text
    "rounded-full", // the pill
    "border-[#00c290]", // the card's own border colour
    "rgba(0,194,144", // the fill, in hex-alpha's other spelling
    "slice(0, 3)", // the silent overflow rule
  ];

  for (const file of [CAROUSEL, PAGE]) {
    const source = read(file);
    for (const marker of invented) {
      assert.ok(
        !source.includes(marker),
        `${file} still contains "${marker}"; the chip's values belong in ${CHIP}`,
      );
    }
  }
});

test("the chip's colour and radius come from tokens, not literals", () => {
  const source = read(CHIP);

  for (const token of ["--radius-chip", "--brand-3", "--brand-ink"]) {
    assert.ok(source.includes(`var(${token})`), `the chip should use ${token} rather than a literal`);
  }
  assert.ok(
    !/#[0-9a-fA-F]{3,6}/.test(source),
    "the chip has no hex literal left: every colour it uses is a token",
  );
  assert.ok(
    !source.includes("bg-gradient"),
    "the card's translucent fill was dropped on purpose: brand ink over it measures 3.82:1, under " +
      "the 4.5:1 AA floor for text this size, against 5.00:1 without it",
  );
});

test("the chip scales with the card and stands still on the page", () => {
  const source = read(CHIP);
  const tiers = [...source.matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));

  assert.equal(tiers.length, 4, "three card tiers plus the page's single size");
  assert.deepEqual(
    tiers.slice(0, 3),
    [10, 9, 8],
    "the card's chips step down as the card does; a fixed chip would be oversized on the outer tiers",
  );
  assert.equal(tiers[3], 10, "the page's chip is one size, and it is the card's active size");
});

test("the overflow chip is counted for sighted users and described for screen readers", () => {
  const source = read(CHIP);

  assert.match(source, /aria-hidden="true">\+\{hidden\}/, "the visible chip reads +n");
  assert.match(
    source,
    /\{hidden\} more \{hidden === 1 \? "tag" : "tags"\}/,
    'a bare "+4" inside a card\'s link is not a sentence; the count is spelled out for assistive ' +
      "technology beside it",
  );
});

test("the rule is not re-implemented in the component", () => {
  const source = read(CHIP);

  assert.match(
    source,
    /selectTags\(/,
    "the chip must call the tested rule rather than slicing the array itself",
  );
  assert.ok(
    !/\.slice\(/.test(source),
    "a slice here would be a second, untested copy of the overflow rule",
  );
  assert.ok(read(RULE).includes("CARD_TAG_LIMIT"), "the limit lives with the rule");
});
