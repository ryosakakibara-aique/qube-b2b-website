import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DURATION, LOGO_STAGGER, logoDelay } from "../components/motion/tokens.ts";

/**
 * The client-logo grid.
 *
 * The same eight logos were declared twice — once in the hero strip, once over the client marquee —
 * as two byte-identical lists, so adding a client meant editing two files and keeping them in step by
 * hand. They now come from one module that both grids map.
 *
 * These checks are static because the component renders JSX, which Node's test runner cannot import.
 * The extraction's real guarantee is not asserted here: the rendered markup of both grids was
 * compared byte for byte against the previous build, because the two contexts differ in their gaps,
 * their image class and whether each logo is wrapped in a centring div, and normalising any of those
 * would have been an unrequested visual change.
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

const sourceFiles = ["app", "components"]
  .flatMap((directory) => collectSourceFiles(path.join(projectRoot, directory)))
  .map((file) => path.relative(projectRoot, file).replace(/\\/g, "/"))
  .sort();

const GRID = "components/layout/client-logo-grid.tsx";

test("the client logo list is declared in exactly one place", () => {
  const declaring = sourceFiles.filter((file) =>
    read(file).includes("jollibee-logo.svg"),
  );

  assert.deepEqual(
    declaring,
    [GRID, "components/layout/success-stories-carousel.tsx"],
    "the eight client logos belong to one module. The success-story carousel draws on the same " +
      "logo files but is a separate dataset — stories with their own destinations — and keeps its " +
      "own records on purpose.",
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
      new RegExp(`<ClientLogoGrid variant="${variant}" />`),
      `${file} should render the shared grid`,
    );
    assert.ok(
      !source.includes("jollibee-logo.svg"),
      `${file} still declares its own logo list`,
    );
    assert.ok(
      !source.includes("clientLogos"),
      `${file} still references a local logo array`,
    );
  }
});

test("every client logo is described for assistive technology", () => {
  const source = read(GRID);
  const entries = [
    ...source.matchAll(
      /src:\s*"([^"]+)",\s*alt:\s*"([^"]+)",\s*width:\s*(\d+),\s*height:\s*(\d+)/g,
    ),
  ];

  assert.equal(entries.length, 8, "expected all eight client logos");

  for (const [, src, alt, width, height] of entries) {
    assert.ok(alt.trim().length > 0, `${src} has no alt text`);
    assert.ok(
      Number(width) > 0 && Number(height) > 0,
      `${src} needs real dimensions so next/image can reserve space and the strip cannot shift`,
    );
  }
});

test("the logos reveal one after another, and the sequence is bounded", () => {
  const source = read(GRID);

  assert.match(
    source,
    /CLIENT_LOGOS\.map\(\(logo, index\)/,
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
    "grid grid-cols-2 items-center gap-x-8 gap-y-4 sm:grid-cols-4",
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
