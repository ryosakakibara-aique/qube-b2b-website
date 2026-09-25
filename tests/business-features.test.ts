import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The business-features grid on `/`.
 *
 * Three faults lived here and all three were reproduced faithfully by the markup: the vertical rule
 * was `lg:border-r`, so the two-column layout at `sm` had no divider at all; every cell carried both
 * `border-b` and `lg:border-r` including the last column and last row, so the panel's own right and
 * bottom edges were doubled to 2px; and both doubled rules were then clipped by the panel's rounded
 * `overflow-hidden`, so they stopped short of the corners instead of meeting the frame.
 *
 * The design draws the grid a different way, and the geometry export settles it: nine tiles 346.667px
 * wide sitting adjacent in a 1040px panel, their 1px strokes coincident on the shared edges, inside a
 * panel stroked at rx 29.5 (→30). Gaps reproduce that exactly; cell borders cannot. These checks pin
 * the gap mechanism, the panel's geometry, and the content contract.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const PAGE = "app/(marketing)/page.tsx";
const source = read(PAGE);
const section = source.slice(
  source.indexOf("const businessFeatures"),
  source.indexOf("<ParallaxFeaturesSection"),
);

const CELLS = [...section.matchAll(/title: "([^"]+)",\s*headline: "([^"]+)",\s*text: "([^"]+)"/g)].map(
  ([, title, headline, text]) => ({ title, headline, text }),
);

test("the grid carries the client's twelve categories", () => {
  assert.equal(CELLS.length, 12, "the client supplied twelve titles");
  assert.equal(new Set(CELLS.map((c) => c.title)).size, 12, "no category should repeat");

  for (const cell of CELLS) {
    for (const [field, value] of Object.entries(cell)) {
      assert.ok(value.trim().length > 0, `${cell.title} has an empty ${field}`);
      assert.equal(
        value,
        value.trim(),
        `${cell.title}'s ${field} carries leading or trailing whitespace`,
      );
    }
  }
});

test("the copy that was corrected stays corrected", () => {
  const titles = CELLS.map((c) => c.title);

  assert.ok(titles.includes("Hospitals & Healthcare"), '"Heathcare" was a typo');
  assert.ok(
    !source.includes("Heathcare"),
    "the misspelling must not come back through a later paste",
  );
  assert.ok(titles.includes("Residential"), '"Residentials" was corrected to "Residential"');

  const lifestyle = CELLS.find((c) => c.title === "Lifestyle Parks");
  assert.deepEqual(
    lifestyle,
    {
      title: "Lifestyle Parks",
      headline: "Enjoy More, Carry Less.",
      text: "Walk, jog, shop, and enjoy more when you carry less of your things.",
    },
    "Lifestyle Parks was the one entry not in the house style: sentence case, no full stop, and a " +
      "comma splice. The client approved these two strings.",
  );
});

test("each cell renders a title, a headline and its text", () => {
  const cell = section.slice(section.indexOf("businessFeatures.map"));

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
  const cell = section.slice(section.indexOf("businessFeatures.map"));

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
  const cell = section.slice(section.indexOf("businessFeatures.map"));

  assert.match(
    cell,
    /variant="fade"/,
    "a gap is the line here: translating a cell would slide it off the grid's background and open a " +
      "band of border colour behind it",
  );
  assert.match(cell, /index=\{index\}/, "the cells are staggered by their index");
});
