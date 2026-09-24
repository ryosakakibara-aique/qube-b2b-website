import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The site's favicon.
 *
 * The design has one mark but the browser chrome behind it has two grounds, so there are two PNGs and
 * the browser picks one with `prefers-color-scheme`. That choice cannot be expressed by the `app/`
 * file convention — `app/favicon.ico` emits a single icon with no media query — so it is declared in
 * the root layout's `icons` field instead.
 *
 * Two things about this wiring are easy to get wrong silently and are pinned here: the light file
 * must not be paired with the dark media query (they are near-identical greys, so a transposition
 * looks fine in review), and no icon entry may omit its media query, because an icon without one
 * matches every scheme and would win in both — depending on which icon the engine happens to prefer
 * rather than on the visitor's theme.
 */

const projectRoot = process.cwd();
const LAYOUT = "app/layout.tsx";
const PUBLIC_DIR = "public";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function pngProperties(file: string): { width: number; height: number; colourType: number } {
  const bytes = fs.readFileSync(file);
  assert.equal(
    bytes.subarray(1, 4).toString("latin1"),
    "PNG",
    `${file} should be a PNG, going by its signature`,
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colourType: bytes[25],
  };
}

const layout = read(LAYOUT);

/** Every `{ url, …, media }` icon descriptor in the layout, in source order. */
const icons = [...layout.matchAll(/url:\s*"(\/[^"]+)"[\s\S]{0,240}?media:\s*"([^"]+)"/g)].map(
  (match) => ({ url: match[1], media: match[2] }),
);

test("both favicons are declared, each with its own colour scheme", () => {
  assert.deepEqual(
    icons,
    [
      { url: "/qube-light-favicon.png", media: "(prefers-color-scheme: light)" },
      { url: "/qube-dark-favicon.png", media: "(prefers-color-scheme: dark)" },
    ],
    "the light artwork must answer the light scheme and the dark artwork the dark one",
  );
});

test("no icon is declared without a media query", () => {
  const iconBlock = layout.slice(layout.indexOf("icons: {"), layout.indexOf("openGraph: {"));
  const urls = [...iconBlock.matchAll(/url:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.equal(
    urls.length,
    icons.length,
    "an icon entry with no media query matches every colour scheme and would compete with the pair",
  );
});

test("both files are square and large enough to survive a 16px tab", () => {
  const failures: string[] = [];

  for (const { url } of icons) {
    const file = path.join(projectRoot, PUBLIC_DIR, url);
    assert.ok(exists(path.join(PUBLIC_DIR, url)), `${url} is referenced but missing from public/`);

    const { width, height, colourType } = pngProperties(file);
    if (width !== height) failures.push(`${url} is ${width}x${height}, not square`);
    if (width < 48) failures.push(`${url} is only ${width}px; 48 is the smallest useful favicon`);
    if (colourType !== 6) {
      failures.push(`${url} has no alpha channel (colour type ${colourType}) and would sit on a box`);
    }
  }

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("the two files are actually different artwork", () => {
  const [light, dark] = icons.map(({ url }) => fs.readFileSync(path.join(projectRoot, PUBLIC_DIR, url)));

  assert.ok(
    !light.equals(dark),
    "a light and a dark entry pointing at identical bytes would never change anything on screen",
  );
});

test("nothing in public/ is left unused", () => {
  const referenced = new Set(icons.map(({ url }) => path.basename(url)));
  const onDisk = fs
    .readdirSync(path.join(projectRoot, PUBLIC_DIR))
    .filter((name) => name.includes("favicon"));

  for (const name of onDisk) {
    if (name === "favicon.ico") continue; // the path clients request directly, declared below
    assert.ok(referenced.has(name), `public/${name} is not referenced by any metadata`);
  }
  assert.deepEqual(
    [...referenced].sort(),
    onDisk.filter((name) => name !== "favicon.ico").sort(),
    "every favicon in public/ should be declared, and nothing declared that is not there",
  );
});

test("Next's own default icon is gone, and /favicon.ico is QUBE's artwork", () => {
  assert.ok(
    !exists("app/favicon.ico"),
    "the app/ file convention is unshifted ahead of the declared pair and carries no media query, so " +
      "leaving it in place serves create-next-app's logo in both colour schemes",
  );

  const ico = fs.readFileSync(path.join(projectRoot, PUBLIC_DIR, "favicon.ico"));
  assert.equal(ico.readUInt16LE(0), 0, "ICO reserved field");
  assert.equal(ico.readUInt16LE(2), 1, "ICO type: 1 is an icon");
  assert.equal(ico.readUInt16LE(4), 1, "one image is embedded");

  const width = ico[6] === 0 ? 256 : ico[6];
  const height = ico[7] === 0 ? 256 : ico[7];
  const length = ico.readUInt32LE(14);
  const offset = ico.readUInt32LE(18);
  const payload = ico.subarray(offset, offset + length);

  assert.ok(width >= 48 && height >= 48, `the embedded image is only ${width}x${height}`);
  assert.equal(
    payload.subarray(1, 4).toString("latin1"),
    "PNG",
    "the embedded image is PNG-compressed rather than a BMP DIB",
  );

  const light = fs.readFileSync(path.join(projectRoot, PUBLIC_DIR, "qube-light-favicon.png"));
  assert.ok(
    payload.equals(light),
    "public/favicon.ico should carry the light artwork verbatim, so there is no third drawing to " +
      "keep in step with the other two",
  );
});
