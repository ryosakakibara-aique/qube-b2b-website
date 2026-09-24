import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The PANDORA showcase tiles and their images.
 *
 * The tiles are not interchangeable: two of them span two columns, one spans two rows, and six are
 * single. The exported images follow the same three shapes — two wide, one tall, six single — but they
 * are named `pandora-1` … `pandora-9` with nothing in their metadata to say which photograph belongs
 * where, so the pairing was made by shape. That is exactly the kind of join that survives a refactor
 * looking correct while showing a portrait photograph in a landscape tile, so it is pinned here.
 *
 * The dimensions are read from the PNG headers rather than hardcoded, so re-exporting an asset at a
 * different size is checked rather than assumed.
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

const source = read(COMPONENT);
const ids = [...source.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const images = [...source.matchAll(/image:\s*`\$\{IMAGE_DIR\}\/([^`]+)`/g)].map(
  (m) => m[1],
);
const spans = [...source.matchAll(/gridClassName:\s*"([^"]+)"/g)].map((m) => m[1]);

test("every tile has an image, and the files are on disk", () => {
  assert.equal(ids.length, 9, "the showcase is a nine-tile grid");
  assert.equal(images.length, 9, "each tile needs its own image");
  assert.equal(spans.length, 9);

  const unique = new Set(images);
  assert.equal(unique.size, 9, "no image should be used twice");

  const onDisk = fs
    .readdirSync(path.join(projectRoot, IMAGE_DIR))
    .filter((name) => name.endsWith(".png"))
    .sort();
  assert.deepEqual(
    [...unique].sort(),
    onDisk,
    "every image in the directory should be used, and nothing else referenced",
  );
});

test("the shape of each image matches the shape of its tile", () => {
  const wide = spans.filter((value) => value.includes("lg:col-span-2"));
  const tall = spans.filter((value) => value.includes("lg:row-span-2"));

  assert.equal(wide.length, 2, "two tiles span two columns");
  assert.equal(tall.length, 1, "one tile spans two rows");

  const failures: string[] = [];

  spans.forEach((span, index) => {
    const file = path.join(projectRoot, IMAGE_DIR, images[index]);
    const { width, height } = pngSize(file);
    const ratio = width / height;

    if (span.includes("lg:col-span-2") && ratio < 1.5) {
      failures.push(
        `${ids[index]}: a two-column tile needs a wide image, but ${images[index]} is ${ratio.toFixed(2)}:1`,
      );
    }
    if (span.includes("lg:row-span-2") && ratio > 1) {
      failures.push(
        `${ids[index]}: a two-row tile needs a portrait image, but ${images[index]} is ${ratio.toFixed(2)}:1`,
      );
    }
    if (!span.includes("span") && ratio >= 2) {
      failures.push(
        `${ids[index]}: a single tile would crop a doubled image badly, and ${images[index]} is ${ratio.toFixed(2)}:1`,
      );
    }
  });

  assert.deepEqual(failures, [], failures.join("\n"));
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
