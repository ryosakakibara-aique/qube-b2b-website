import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * One `<main>`, one `<header>` per page — including the ones React streams.
 *
 * A product page served **two of each**, and it was not a mistake in the page: `loading.tsx` wrapped
 * its skeleton in a `<main>` and rendered `<SiteNav>` (a `<header>`) inside it. React does not throw
 * that skeleton away when the page arrives — it streams the page into a hidden element and reveals
 * it — so both subtrees stay in the document and the duplicate landmarks ship to every visitor.
 *
 * That is an accessibility fault before it is anything else: two `main` landmarks make "skip to main
 * content" ambiguous and give a screen-reader user two headers to traverse. It also muddles the
 * structural outline that a crawler or an answer engine reads.
 *
 * The rule this pins is narrow and checkable: **no `loading.tsx` may declare a landmark element.**
 * A page supplies its own; the loading boundary is a placeholder inside it, not a second page.
 */

const projectRoot = process.cwd();

/** Every `loading.tsx` in the app, wherever it sits. */
function loadingFiles(dir = path.join(projectRoot, "app"), found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) loadingFiles(full, found);
    else if (entry.name === "loading.tsx") found.push(full);
  }
  return found;
}

const files = loadingFiles();

/**
 * The file's markup, with comments removed.
 *
 * Checking raw source would flag the very comment that explains the rule — the same false positive
 * that made the first version of `tests/robots.test.ts` fail on the word "localhost" in its own
 * explanation. A test that punishes documenting a defect teaches the wrong lesson.
 */
function markupOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

test("the app has loading boundaries to check", () => {
  assert.ok(files.length > 0, "expected at least one loading.tsx");
});

test("no loading boundary declares a landmark element", () => {
  for (const file of files) {
    const source = markupOnly(fs.readFileSync(file, "utf8"));
    const relative = path.relative(projectRoot, file);

    assert.ok(
      !/<main\b/.test(source),
      `${relative} renders a <main>: the real page also renders one, and React keeps both, so the ` +
        "document ships two main landmarks. Use a plain element — the page owns the landmark.",
    );
    assert.ok(
      !/<header\b/.test(source),
      `${relative} renders a <header>. <SiteNav> already supplies the page's single header landmark.`,
    );
    assert.ok(
      !/<footer\b/.test(source),
      `${relative} renders a <footer>. The page owns that landmark.`,
    );
  }
});

test("a loading boundary still announces itself to assistive technology", () => {
  for (const file of files) {
    const source = markupOnly(fs.readFileSync(file, "utf8"));
    const relative = path.relative(projectRoot, file);

    assert.match(
      source,
      /role="status"/,
      `${relative} should announce the wait with role="status" rather than silently changing`,
    );
    assert.match(
      source,
      /aria-live="polite"/,
      `${relative} should be polite: a loading state is not an emergency`,
    );
    assert.match(
      source,
      /sr-only/,
      `${relative} should carry screen-reader-only text naming what is loading`,
    );
  }
});
