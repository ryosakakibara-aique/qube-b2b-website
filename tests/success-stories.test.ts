import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The success-story cards.
 *
 * The photograph and its wash are a **client-requested addition** — no Figma frame defines an image in
 * this card — and the spec is precise: a black overlay at 80% at rest, replaced by the brand gradient
 * at 30% on hover. Two things make that easy to get wrong:
 *
 * - the card already had its own hover gradient at 50%, and stacking a second wash over the same
 *   photograph darkens it, so the 30% stops meaning 30%;
 * - a single background colour cannot interpolate from black to a three-stop gradient, so the two
 *   layers have to cross-fade rather than be one animated value.
 *
 * Both are pinned here, along with the things that must not regress while the card changes: the logo
 * is still the only text, the duplicate loop copy stays out of the accessibility tree, and the card's
 * destination is still deferred.
 */

const projectRoot = process.cwd();
const COMPONENT = "components/layout/success-stories-carousel.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const source = read(COMPONENT);

test("the cards are content, not a module constant", () => {
  assert.match(
    source,
    /export function SuccessStoriesCarousel\(\{ stories \}/,
    "the stories arrive as a prop: they are homepage content now, shared with /products",
  );
  assert.match(source, /stories\.map\(/, "one card per stored story");
  assert.ok(
    !source.includes("jollibee-logo.svg"),
    "the logo paths belong to the homepage content, not to this component",
  );
});

test("the photograph sits under the wash, and is decorative", () => {
  assert.match(
    source,
    /card\.imageUrl \?[\s\S]{0,240}alt=""/,
    "the photograph is a background inside a link whose only name is the logo's alt text, so it is " +
      "decorative; describing it would also mean inventing a description nobody supplied",
  );
  assert.match(
    source,
    /sizes="270px"/,
    "the card is 270px wide: without a sizes hint next/image would fetch a full-width copy",
  );
  assert.match(source, /object-cover/);
});

test("at rest the wash is black at 80%", () => {
  assert.match(
    source,
    /bg-black\/80[^"]*group-hover:opacity-0/,
    "the client's rest state is a black overlay at 80%, dropped on hover",
  );
});

test("on hover the wash becomes the brand gradient at 30%", () => {
  assert.match(
    source,
    /from-\[#00c290\]\/30 via-\[#0fb8aa\]\/30 to-\[#1fadc5\]\/30/,
    "the hover wash is the brand gradient at 30% — the same three stops the CTAs use",
  );
  assert.match(
    source,
    /opacity-0[^"]*group-hover:opacity-100/,
    "the gradient layer starts invisible and fades in, which is what makes the two states cross-fade",
  );
});

test("the card's old hover gradient is gone rather than layered", () => {
  assert.ok(
    !source.includes("/50"),
    "the 50% hover gradient from the previous round must be replaced: two washes over one " +
      "photograph darken each other and the 30% value stops meaning anything",
  );
  assert.ok(
    !source.includes("hover:bg-gradient-to-b"),
    "the card no longer paints its own gradient on hover; the overlay does",
  );
});

test("the logo is still the card's only text, and the loop copy stays decorative", () => {
  assert.match(source, /alt=\{duplicate \? "" : card\.name\}/);
  assert.match(
    source,
    /aria-hidden="true"[\s\S]{0,80}\{content\}/,
    "the second pass exists to close the loop: it must stay out of the accessibility tree",
  );
  assert.match(
    source,
    /brightness-0 invert/,
    "story logos are drawn as white silhouettes, so a PNG with a white plate would invert into a " +
      "black rectangle — the upload guidance asks for a transparent background for this reason",
  );
});

test("the card's destination is still deferred, and only one copy is a link", () => {
  assert.match(
    source,
    /<Link href="#"/,
    "per-card destinations are a separate, client-deferred task: the card points at '#' on purpose",
  );
  assert.equal(
    [...source.matchAll(/<Link /g)].length,
    1,
    "the duplicate pass renders a div, so there is exactly one link per visible card",
  );
});
