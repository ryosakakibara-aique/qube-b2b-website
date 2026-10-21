import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EMPTY_TILE, SHOWCASE_SLOTS } from "../lib/content/showcase.ts";
import { HOMEPAGE_DEFAULTS } from "../lib/content/defaults.ts";
import { SHOWCASE_TILE_COUNT } from "../lib/content/validation.ts";

/**
 * The PANDORA showcase: nine slots of geometry, nine tiles of content.
 *
 * The tiles are not interchangeable. Two slots span two columns, one spans two rows, six are single,
 * and their placements are hand-written classes — so the slots are code and only the label and the
 * photograph are editorial. The exported photographs follow the same three shapes (two wide, one tall,
 * six single) but are named `pandora-1` … `pandora-9` with nothing in their metadata to say which
 * feature each belongs to, so the pairing was made by shape. That is exactly the kind of join that
 * survives a refactor looking correct while showing a portrait photograph in a landscape tile.
 *
 * Dimensions are read from each PNG's IHDR rather than hardcoded, so re-exporting an asset at a
 * different size is checked rather than assumed. The stored defaults are what gets checked here; the
 * CMS instructs an author to upload the same shape (the slot's `uploadNote`) and validation refuses a
 * tenth or a ninth-missing tile.
 */

const projectRoot = process.cwd();
const COMPONENT = "components/layout/pandora-showcase-grid.tsx";
const IMAGE_DIR = "public/pandora-features-images";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const bytes = fs.readFileSync(file);
  const isPng = bytes.subarray(1, 4).toString("latin1") === "PNG";

  assert.ok(isPng, `${file} should be a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const tiles = HOMEPAGE_DEFAULTS.showcaseTiles;

test("there is one tile per slot, and the count is fixed", () => {
  assert.equal(SHOWCASE_SLOTS.length, 9, "the showcase is a nine-tile grid");
  assert.equal(SHOWCASE_TILE_COUNT, SHOWCASE_SLOTS.length);
  assert.equal(tiles.length, SHOWCASE_TILE_COUNT, "a tile per slot, in slot order");

  assert.equal(
    new Set(SHOWCASE_SLOTS.map((slot) => slot.id)).size,
    9,
    "slot ids are the React keys and the DOM identity, so they must be unique",
  );

  for (const tile of tiles) {
    assert.ok(tile.label.trim().length > 0, "every tile needs its label");
    assert.ok(tile.imageUrl.trim().length > 0, `${tile.label} has no photograph`);
    assert.equal(tile.label, tile.label.trim(), `${tile.label} carries stray whitespace`);
  }
});

test("every stored image is on disk, and nothing is referenced twice", () => {
  const referenced = tiles.map((tile) =>
    path.basename(tile.imageUrl),
  );

  assert.equal(new Set(referenced).size, 9, "no image should be used twice");

  const onDisk = fs
    .readdirSync(path.join(projectRoot, IMAGE_DIR))
    .filter((name) => name.endsWith(".png"))
    .sort();

  assert.deepEqual(
    [...referenced].sort(),
    onDisk,
    "every image in the directory should be used, and nothing else referenced",
  );
});

test("the shape of each image matches the shape of its slot", () => {
  const wide = SHOWCASE_SLOTS.filter((slot) => slot.shape === "wide");
  const tall = SHOWCASE_SLOTS.filter((slot) => slot.shape === "tall");

  assert.equal(wide.length, 2, "two slots span two columns");
  assert.equal(tall.length, 1, "one slot spans two rows");

  const failures: string[] = [];

  SHOWCASE_SLOTS.forEach((slot, index) => {
    const file = path.join(projectRoot, IMAGE_DIR, path.basename(tiles[index].imageUrl));
    const { width, height } = pngSize(file);
    const ratio = width / height;

    if (slot.shape === "wide" && ratio < 1.5) {
      failures.push(
        `${slot.id}: a two-column slot needs a wide image, but ${tiles[index].imageUrl} is ${ratio.toFixed(2)}:1`,
      );
    }
    if (slot.shape === "tall" && ratio > 1) {
      failures.push(
        `${slot.id}: a two-row slot needs a portrait image, but ${tiles[index].imageUrl} is ${ratio.toFixed(2)}:1`,
      );
    }
    if (slot.shape === "single" && ratio >= 2) {
      failures.push(
        `${slot.id}: a single slot would crop a doubled image badly, and ${tiles[index].imageUrl} is ${ratio.toFixed(2)}:1`,
      );
    }
  });

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("the panel's geometry is the design's", () => {
  const source = read(COMPONENT);

  assert.match(
    source,
    /grid-cols-1[^"]*lg:h-\[1082px\][^"]*lg:grid-cols-3 lg:grid-rows-4/,
    "the panel is a fixed 3x4 composition on wide screens; the slots' spans only make sense inside it",
  );
  assert.match(source, /rounded-\[30px\]/, "the panel keeps the design's 30px radius");

  const spans = SHOWCASE_SLOTS.map((slot) => slot.gridClassName);

  assert.equal(
    spans.filter((value) => value.includes("lg:col-span-2")).length,
    2,
    "two wide slots",
  );
  assert.equal(
    spans.filter((value) => value.includes("lg:row-span-2")).length,
    1,
    "one tall slot",
  );

  for (const slot of SHOWCASE_SLOTS) {
    assert.ok(
      read("lib/content/showcase.ts").includes(`"${slot.gridClassName}"`),
      `${slot.id}'s placement must live in the slot list, not be invented at render time`,
    );
  }
});

test("the tiles render from the slot list and the stored content", () => {
  const source = read(COMPONENT);

  assert.match(
    source,
    /SHOWCASE_SLOTS\.map\(\(slot, index\)/,
    "the panel is drawn from the slot list, one cell per slot",
  );
  assert.match(
    source,
    /tiles\[index\] \?\? EMPTY_TILE/,
    "a missing tile falls back to an empty one rather than reading undefined",
  );
  assert.match(
    source,
    /\{tile\.imageUrl\}/,
    "the photograph comes from the record, not from a path baked into the component",
  );
  assert.ok(
    !source.includes("pandora-features-images"),
    "the image directory belongs to the defaults, not to the renderer",
  );
});

test("every tile animates in through the link itself", () => {
  const source = read(COMPONENT);
  const link = read("components/motion/reveal-link.tsx");

  assert.equal(
    [...source.matchAll(/<RevealLink/g)].length,
    1,
    "the tiles come from one mapped component, so there is a single call site to keep animated",
  );
  assert.ok(
    source.includes('variant="fade"'),
    "fade only: these tiles share their 1px rules with their neighbours, so moving one would pull " +
      "the panel's edges apart mid-animation",
  );
  assert.ok(
    source.includes("index={index}"),
    "the index has to reach the link, or every tile animates at once",
  );
  assert.ok(
    link.includes("m.create(Link)"),
    "the link itself animates. Wrapping it in a motion div would move `lg:col-start-*`, " +
      "`lg:col-span-2` and `lg:row-span-2` onto the wrapper and change the grid it sits in",
  );
});

test("the photographs are marked decorative rather than invented", () => {
  const source = read(COMPONENT);

  assert.ok(
    source.includes('alt=""'),
    "the label beside each image already names the feature: describing pictures nobody here has " +
      "seen would mean inventing alt text",
  );
  assert.ok(
    source.includes("object-cover"),
    "the tiles are a fixed grid, so the images fill them rather than letterboxing",
  );
});

test("the empty tile is renderable", () => {
  assert.equal(EMPTY_TILE.label, "");
  assert.equal(EMPTY_TILE.imageUrl, "");
});
