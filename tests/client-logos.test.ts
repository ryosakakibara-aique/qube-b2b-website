import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DURATION, LOGO_STAGGER, logoDelay } from "../components/motion/tokens.ts";
import { HOMEPAGE_DEFAULTS } from "../lib/content/defaults.ts";

/**
 * The client-logo grid.
 *
 * The logos are homepage content now (`/cms/home`, section 4), so this file checks three things that
 * used to be one: the list is declared exactly once (in the defaults, which the page renders until the
 * record is saved), both grids are consumers of the shared component rather than owners of a list, and
 * the two contexts still differ in the ways the design requires.
 *
 * That last part is the reason these checks are static. The hero strip and the marquee differ in their
 * gaps, their image class and whether each logo sits in a centring wrapper; normalising any of them
 * would be an unrequested visual change, and this workspace has no browser in which to judge it.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function collectSourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...collectSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return found;
}

const sourceFiles = ["app", "components", "lib"]
  .flatMap((directory) => collectSourceFiles(path.join(projectRoot, directory)))
  .map((file) => path.relative(projectRoot, file).replace(/\\/g, "/"))
  .sort();

const GRID = "components/layout/client-logo-grid.tsx";
const DEFAULTS = "lib/content/defaults.ts";

test("the client logo list is declared in exactly one place", () => {
  const declaring = sourceFiles.filter((file) =>
    read(file).includes("jollibee-logo.svg"),
  );

  assert.deepEqual(
    declaring,
    [DEFAULTS],
    "the eight logos belong to the homepage content, not to a component. The success-story carousel " +
      "draws on the same brand names but keeps its own records — stories with their own order and " +
      "their own uploads — so the two lists are separate on purpose.",
  );
});

test("both grids render the shared component instead of their own list", () => {
  const instances: Array<[string, string]> = [
    ["components/layout/hero-video-section.tsx", "hero"],
    ["components/layout/client-logo-marquee.tsx", "marquee"],
  ];

  for (const [file, variant] of instances) {
    const source = read(file);

    assert.match(
      source,
      new RegExp(`<ClientLogoGrid\\s+variant="${variant}"\\s+logos=\\{logos\\}`),
      `${file} should render the shared grid with the list it was given`,
    );
    assert.ok(
      !source.includes("jollibee-logo.svg"),
      `${file} still declares its own logo list`,
    );
    assert.ok(
      !source.includes("CLIENT_LOGOS"),
      `${file} still references the retired module-level array`,
    );
  }

  assert.match(
    read(GRID),
    /logos: ClientLogo\[\]/,
    "the grid takes the list as a prop: it is content now, not a module constant",
  );
});

test("every client logo is described and sized", () => {
  const logos = HOMEPAGE_DEFAULTS.logos;

  assert.equal(logos.length, 8, "expected all eight client logos");

  for (const logo of logos) {
    assert.ok(logo.name.trim().length > 0, `${logo.imageUrl} has no alt text`);
    assert.ok(
      logo.width > 0 && logo.height > 0,
      `${logo.imageUrl} needs real dimensions so next/image can reserve space and the strip cannot shift`,
    );
  }
});

test("the logos reveal one after another, and the sequence is bounded", () => {
  const source = read(GRID);

  assert.match(
    source,
    /logos\.map\(\(logo, index\)/,
    "the logos must be mapped with their index, since that index is what sequences them",
  );
  assert.match(source, /<RevealImage/, "each mapped logo should be the animated image");
  assert.match(
    source,
    /index=\{index\}/,
    "the index has to reach the primitive, or every logo animates at once",
  );

  const LOGO_COUNT = 8;
  const lastLogo = LOGO_COUNT - 1;

  assert.equal(logoDelay(0), 0, "the first logo must not wait");
  assert.equal(
    logoDelay(lastLogo),
    Number((LOGO_STAGGER * lastLogo).toFixed(4)),
    "the eighth logo starts 350ms in",
  );
  assert.ok(
    logoDelay(lastLogo) <= 0.4,
    `the last logo waits ${logoDelay(lastLogo)}s, which reads as a stall rather than a sequence`,
  );
  assert.ok(
    logoDelay(lastLogo) + DURATION.reveal <= 0.8,
    "the whole strip should have settled inside 0.8s of entering the viewport",
  );

  for (let index = 1; index <= lastLogo; index += 1) {
    assert.ok(
      logoDelay(index) > logoDelay(index - 1),
      "every logo needs its own beat: three logos sharing one delay looks like a dropped animation",
    );
  }
});

test("both contexts' layout survives the animation", () => {
  const grid = read(GRID);
  const primitive = read("components/motion/reveal-image.tsx");

  const mustSurvive = [
    "grid grid-cols-2 items-center gap-x-10 gap-y-6 sm:grid-cols-4",
    "grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-4 sm:grid-cols-4",
    "h-auto w-auto",
    "h-auto max-h-8 w-auto opacity-90",
  ];

  for (const className of mustSurvive) {
    assert.ok(
      grid.includes(className),
      `"${className}" did not survive, which changes how one of the two grids looks`,
    );
  }

  // The centring wrapper is the only structural difference between the two contexts. It lives in the
  // primitive now, because that is what renders each logo — but *whether* it is used still comes from
  // the variant, so neither grid can silently adopt the other's structure.
  assert.ok(
    primitive.includes('className="flex items-center justify-center"'),
    "the hero strip's centring wrapper was lost, so its logos are no longer centred in their cells",
  );
  assert.match(
    grid,
    /centred=\{centreEachLogo\}/,
    "the wrapper choice has to stay driven by the variant",
  );
});

test("the marquee centres its logos in their cells, on both axes", () => {
  const grid = read(GRID);
  const marquee = grid.slice(grid.indexOf("marquee: {"), grid.indexOf("} as const"));

  assert.match(
    marquee,
    /justify-items-center/,
    "the marquee's logos are the grid items, so the grid has to centre them: a grid item that is a " +
      "replaced element with an intrinsic size and aspect ratio aligns to `start` instead of " +
      "stretching, which left every logo packed against the left edge of a cell as wide as the " +
      "widest logo. That is the fault the client reported on mobile, and it was present at every " +
      "width — do not remove this class.",
  );
  assert.match(
    marquee,
    /items-center/,
    "the block axis still needs centring, or short logos sit against the top of their row while the " +
      "tall ones fill it",
  );

  assert.ok(
    !marquee.includes("centreEachLogo: true"),
    "the marquee centres through the grid, not through the hero's wrapper: the wrapper would put a " +
      "div between each logo and the cell it is placed in",
  );
});

test("the mobile grid stays two columns, four rows", () => {
  const grid = read(GRID);
  const marquee = grid.slice(grid.indexOf("marquee: {"), grid.indexOf("} as const"));

  assert.ok(
    marquee.includes("grid-cols-2") && marquee.includes("sm:grid-cols-4"),
    "the client asked for the 2 x 4 arrangement on mobile to be retained while the logos are " +
      "centred in their cells, so the column counts themselves must not change",
  );
  assert.equal(
    [...grid.matchAll(/grid-cols-2/g)].length,
    2,
    "both contexts are two columns below `sm`, and only the hero's larger gaps separate them",
  );
});
