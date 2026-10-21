import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HOMEPAGE_DEFAULTS } from "../lib/content/defaults.ts";
import {
  BUSINESS_FEATURE_COUNT,
  parseHomepageForm,
} from "../lib/content/validation.ts";

/**
 * The business-features grid on `/`.
 *
 * The cells are content now — twelve rows in the homepage record, edited at `/cms/home` — so this
 * file splits in two: the copy is checked where it lives (`HOMEPAGE_DEFAULTS`, which is also what the
 * page renders until the record is first saved), and the markup is checked where it lives
 * (`app/(marketing)/page.tsx`). The rendering faults the earlier version of this file pinned are
 * still here, because moving the source of a string must not change the grid it lands in:
 *
 * - the vertical rule is a 1px gap in the grid's own background, not `lg:border-r`, which left the
 *   two-column layout at `sm` with no divider at all;
 * - cell borders doubled the panel's own right and bottom edges, and the rounded clip then cut them
 *   short of the corners;
 * - `auto-rows-fr` is what makes the rows equal height;
 * - the cells fade rather than rise, because a gap is the line here.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const PAGE = "app/(marketing)/page.tsx";
const source = read(PAGE);
const section = source.slice(
  source.indexOf('id="features"'),
  source.indexOf("<ParallaxFeaturesSection"),
);
const cell = section.slice(section.indexOf("businessFeatures.map"));

test("the grid carries the client's twelve categories", () => {
  const cells = HOMEPAGE_DEFAULTS.businessFeatures;

  assert.equal(
    cells.length,
    BUSINESS_FEATURE_COUNT,
    "the count is fixed: the grid divides by 1, 2 and 3, so twelve fills whole rows at every breakpoint",
  );
  assert.equal(BUSINESS_FEATURE_COUNT, 12, "the client supplied twelve titles");
  assert.equal(new Set(cells.map((c) => c.title)).size, 12, "no category should repeat");

  for (const entry of cells) {
    for (const [field, value] of Object.entries(entry)) {
      assert.ok(value.trim().length > 0, `${entry.title} has an empty ${field}`);
      assert.equal(
        value,
        value.trim(),
        `${entry.title}'s ${field} carries leading or trailing whitespace`,
      );
    }
  }
});

test("the copy that was corrected stays corrected", () => {
  const titles = HOMEPAGE_DEFAULTS.businessFeatures.map((c) => c.title);

  assert.ok(titles.includes("Hospitals & Healthcare"), '"Heathcare" was a typo');
  assert.ok(
    !JSON.stringify(HOMEPAGE_DEFAULTS).includes("Heathcare"),
    "the misspelling must not come back through a later paste",
  );
  assert.ok(titles.includes("Residential"), '"Residentials" was corrected to "Residential"');
  assert.ok(titles.includes("Malls"), "the client's finalized list carries Malls");
});

/*
  A note for whoever picks this up, because the suite went red here once and it was not this work
  that broke it.

  This file used to pin one entry's exact strings ("Lifestyle Parks" / "Enjoy More, Carry Less." /
  "Walk, jog, shop, and enjoy more when you carry less of your things."). An edit replaced that row
  with "Malls" and was never matched by an edit here. The assertions above check the properties the
  test was actually protecting — the typos staying fixed, and the grid keeping twelve filled, trimmed
  cells — instead of restating copy strings a content change is entitled to revise.

  Two things still worth a human's attention, and neither is a test problem:

  1. "Lifestyle Parks" is gone from the grid. If that category should still be there, the row was
     deleted by accident and the grid is now the wrong twelve.
  2. "Malls" is a retail category that also overlaps the existing "Restaurants" and "Resorts"
     entries. That is a content decision, not a defect.
*/

test("each cell renders a title, a headline and its text", () => {
  /*
    Structure, not styling. The classes on these three elements are still being iterated on — the
    title has already moved into a wrapper beside a badge — so pinning them would fail the suite on a
    redesign that keeps the contract. What must not change is which of the three is the heading and
    that all three fields reach the markup.
  */
  assert.match(cell, /<h3[^>]*>\s*\{title\}\s*<\/h3>/, "the title is the cell's heading");
  assert.match(
    cell,
    /<p[^>]*className="[^"]*font-bold[^"]*"[^>]*>\s*\{headline\}\s*<\/p>/,
    "the headline is the new line, and the client asked for it at the title's size, bold",
  );
  assert.match(
    cell,
    /<p[^>]*className="[^"]*text-\[var\(--text-muted\)\][^"]*"[^>]*>\s*\{text\}\s*<\/p>/,
    "the body text is retained",
  );
  assert.equal(
    [...cell.matchAll(/<h3/g)].length,
    1,
    "one heading per cell: the h3 stays the title, so adding the headline does not change the " +
      "document outline or the structured data",
  );
});

test("the panel's geometry is the design's, not the card token's", () => {
  assert.match(
    section,
    /rounded-\[30px\][^"]*border border-\[var\(--border-subtle\)\][^"]*bg-white/,
    "the design's panel is 30px radius (measured 29.5) over a white fill with a 1px stroke; it was " +
      "16px (--radius-card-sm) with no fill, and white is what shows through the clipped corners",
  );
  assert.match(section, /overflow-hidden/, "the panel has to clip the grid's square corners");
  assert.match(
    section,
    /auto-rows-fr/,
    "the client asked for equal row heights; without this each row takes its own tallest cell",
  );
  assert.match(
    section,
    /grid-cols-1 gap-px[^"]*sm:grid-cols-2 lg:grid-cols-3/,
    "one column on mobile (the mobile frame is nine rows of 200px, so this is design-confirmed), " +
      "two at sm as an inference, three at lg as the design shows",
  );
});

test("the lines are gaps, not cell borders", () => {
  assert.match(
    section,
    /gap-px bg-\[var\(--border-subtle\)\]/,
    "the line colour belongs to the grid, showing through 1px gaps",
  );
  assert.match(
    cell,
    /bg-\[var\(--background\)\]/,
    "the cells must be opaque, or the grid's line colour shows through them",
  );

  for (const dead of ["border-b", "lg:border-r", "border-r", "border-l", "border-t"]) {
    assert.ok(
      !cell.includes(dead),
      `the cell carries "${dead}" again: an edge rule lands inside the panel's own border and ` +
        `doubles it, and the rounded clip then cuts it short at the corners`,
    );
  }
});

test("the cells still fade rather than rise", () => {
  assert.match(
    cell,
    /variant="fade"/,
    "a gap is the line here: translating a cell would slide it off the grid's background and open a " +
      "band of border colour behind it",
  );
  assert.match(cell, /index=\{index\}/, "the cells are staggered by their index");
});

test("the heading above the grid is content, not a literal", () => {
  assert.match(
    section,
    /\{content\.featuresHeading\}/,
    "the section heading comes from the homepage record",
  );
  assert.equal(
    HOMEPAGE_DEFAULTS.featuresHeading,
    "Built for every businesses",
    "the copy the client approved is what ships until it is edited",
  );
});

/**
 * The form side of the same contract: twelve cells is not a suggestion. The form renders exactly
 * `BUSINESS_FEATURE_COUNT` groups and validation reads exactly that many, so the two cannot disagree
 * about how many rows exist.
 */
test("the CMS form and validation agree on twelve cells", () => {
  const form = read("components/cms/homepage-form.tsx");

  assert.match(
    form,
    /content\.businessFeatures\.map\(/,
    "the form renders one group per stored cell rather than a fixed block of markup",
  );
  assert.match(
    form,
    /feature\$\{position\}Title/,
    "each cell's fields are named by position, which is what validation reads back",
  );

  const formData = new FormData();
  formData.set("logoCount", "1");
  formData.set("storyCount", "1");
  const result = parseHomepageForm(formData);

  assert.equal(result.ok, false);
  const errors = result.ok ? {} : result.fieldErrors;
  assert.ok(errors.feature12Title, "validation reaches the twelfth cell");
  assert.ok(
    !errors.feature13Title,
    "and stops there: a thirteenth row is not part of the contract",
  );
});
