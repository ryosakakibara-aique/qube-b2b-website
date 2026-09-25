import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CARD_GAP,
  CARD_SIZES,
  centerOfIndex,
  nearestIndex,
} from "../components/products/carousel-geometry.ts";

/**
 * The carousel's gesture.
 *
 * The snap is pure arithmetic — where the drag left the strip, which card's centre is nearest — so it
 * is tested for real rather than by reading source. The component renders JSX, which Node's test
 * runner cannot import, so the parts that only exist as event wiring are checked statically.
 *
 * The numbers come from the geometry module, never from literals: the card widths step through three
 * tiers (236 / 212.4 / 188.8), so a fixed "pitch" between cards does not exist and a snap built on one
 * would land on the wrong card.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const CAROUSEL = "components/products/product-carousel.tsx";
const source = read(CAROUSEL);

/** The drag distance that leaves `target` under the middle of the window, for active card `from`. */
function dragTo(from: number, target: number): number {
  return centerOfIndex(from, from) - centerOfIndex(from, target);
}

/** What the component computes after a drag of `dx`: the strip coordinate left under the middle. */
function centreAfterDrag(from: number, dx: number): number {
  return centerOfIndex(from, from) - dx;
}

const ACTIVE = 9; // inside the middle copy of a three-copy strip
const STRIP = 36; // three copies of twelve products

test("a drag that leaves the next card under the middle makes it active", () => {
  const dx = dragTo(ACTIVE, ACTIVE + 1);

  assert.ok(dx < 0, "advancing means dragging the strip to the left");
  assert.equal(nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, dx), STRIP), ACTIVE + 1);
});

test("and the same to the right makes the previous card active", () => {
  const dx = dragTo(ACTIVE, ACTIVE - 1);

  assert.ok(dx > 0, "going back means dragging the strip to the right");
  assert.equal(nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, dx), STRIP), ACTIVE - 1);
});

test("a nudge shorter than half the distance to the next card snaps back", () => {
  const pitch = -dragTo(ACTIVE, ACTIVE + 1);

  for (const fraction of [0.05, 0.2, 0.45]) {
    const dx = -pitch * fraction;
    assert.equal(
      nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, dx), STRIP),
      ACTIVE,
      `a drag of ${(fraction * 100).toFixed(0)}% of the gap is not a swipe`,
    );
  }
});

test("a drag of just over half the gap does advance", () => {
  const pitch = -dragTo(ACTIVE, ACTIVE + 1);
  const dx = -pitch * 0.55;

  assert.equal(nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, dx), STRIP), ACTIVE + 1);
});

test("a drag of one tier pitch advances exactly one card, measured from the table", () => {
  /*
    Deliberately independent arithmetic: the pitch is written out from the tier widths rather than
    asked of `centerOfIndex`. The other snap tests derive their drag from the same function they then
    check, so a broken `centerOfIndex` would cancel itself out and they would still pass.
  */
  const pitch = CARD_SIZES.active.w / 2 + CARD_GAP + CARD_SIZES.adjacent.w / 2;

  assert.equal(nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, -pitch), STRIP), ACTIVE + 1);
  assert.equal(nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, pitch), STRIP), ACTIVE - 1);
});

test("the knife edge belongs to the two neighbours, whichever way it falls", () => {
  const pitch = -dragTo(ACTIVE, ACTIVE + 1);
  const index = nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, -pitch / 2), STRIP);

  // Exactly half a gap is a tie, and a tie is decided by floating point rather than by policy — so
  // the honest assertion is that it resolves to one of the two cards in play, never to a third one.
  // The behaviour that matters is pinned either side of it, at 45% and 55%.
  assert.ok(
    index === ACTIVE || index === ACTIVE + 1,
    `half a gap resolved between cards ${ACTIVE} and ${ACTIVE + 1}, but returned ${index}`,
  );
});

test("a long drag moves several cards and stays inside the strip", () => {
  const pitch = -dragTo(ACTIVE, ACTIVE + 1);

  const forward = nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, -pitch * 3.2), STRIP);
  assert.ok(forward > ACTIVE + 2, "a three-card flick should move about three cards");
  assert.ok(forward < STRIP, "and never past the end of the rendered copies");

  const backward = nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, pitch * 2.1), STRIP);
  assert.ok(backward < ACTIVE - 1 && backward >= 0);
});

test("however hard the strip is thrown, the answer is a real card", () => {
  for (const dx of [-1e6, -5000, 0, 5000, 1e6]) {
    const index = nearestIndex(ACTIVE, centreAfterDrag(ACTIVE, dx), STRIP);

    assert.ok(Number.isInteger(index));
    assert.ok(index >= 0 && index < STRIP, `dx ${dx} produced index ${index}`);
  }
});

test("the gap between cards is not fixed, which is why the snap measures centres", () => {
  const toNeighbour = centerOfIndex(ACTIVE, ACTIVE + 1) - centerOfIndex(ACTIVE, ACTIVE);
  const toSecond = centerOfIndex(ACTIVE, ACTIVE + 2) - centerOfIndex(ACTIVE, ACTIVE + 1);

  assert.notEqual(
    toNeighbour,
    toSecond,
    "the tiers differ in width, so a snap built on one pitch would drift",
  );
  assert.ok(Math.abs(toNeighbour - (CARD_SIZES.active.w / 2 + CARD_GAP + CARD_SIZES.adjacent.w / 2)) < 0.001);
});

test("the strip answers a horizontal pointer, and leaves vertical panning to the page", () => {
  assert.match(source, /onPointerDown=\{onPointerDown\}/);
  assert.match(
    source,
    /window\.addEventListener\("pointermove"/,
    "the drag is followed on the window once a pointer is down",
  );
  assert.match(source, /window\.addEventListener\("pointerup"/);
  assert.match(
    source,
    /window\.addEventListener\("pointercancel"/,
    "a cancelled pointer means the browser took the gesture; the strip has to be put back",
  );
  assert.match(source, /endGesture\(event, true\)/, "pointercancel must take the cancelled path");
  assert.match(
    source,
    /touchAction: "pan-y"/,
    "without this the browser claims every touch gesture as a scroll and cancels the drag",
  );
});

test("the drag is followed on the window rather than by capturing the pointer", () => {
  /*
    Capture looks like the tidier way to survive the pointer leaving the strip, but it retargets
    `pointerup` to the capturing element, and the click that follows goes to the nearest common
    ancestor of the down and up targets — the strip, not the card. A plain tap on a product would then
    stop navigating, which is a worse fault than the one capture solves.
  */
  assert.ok(
    !source.includes("setPointerCapture"),
    "capturing the pointer on the strip would break clicking through to a product",
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{\s*if \(!dragging\) return;/,
    "the window listeners exist only while a pointer is down",
  );
});

test("a drag does not also click the card underneath", () => {
  assert.match(source, /onClickCapture=\{onClickCapture\}/);
  assert.match(source, /suppressClickRef\.current = true/);
  assert.match(
    source,
    /if \(!suppressClickRef\.current\) return;[\s\S]{0,200}event\.preventDefault\(\)/,
    "the click that follows a drag has to be swallowed, or every swipe opens a product page",
  );
  assert.match(
    source,
    /suppressClickRef\.current = false/,
    "and the flag resets, or one drag would eat the next real click",
  );
});

test("the drag writes to the node instead of re-rendering the strip", () => {
  const move = source.slice(source.indexOf("function trackPointer"), source.indexOf("function endGesture"));

  assert.match(move, /moveTrackTo\(/, "the move handler writes the transform through the ref");
  assert.ok(
    !/set[A-Z]\w*\(/.test(move),
    "no state setter in the move handler: 3n cards would re-render on every frame of the drag",
  );
});

test("auto-advance stops for reduced motion, for a hidden strip, and in a background tab", () => {
  const interval = source.slice(source.indexOf("if (copies === 1) return;"));

  assert.match(
    interval,
    /if \(!motionAllowed \|\| !inView \|\| !tabVisible \|\| paused \|\| dragging\) return;/,
    "the timer has to be gated on all five; `motionAllowed` in particular was computed and never " +
      "read, so a visitor who asked for reduced motion was given an auto-advancing strip anyway",
  );
  for (const gate of ["motionAllowed", "inView", "tabVisible"]) {
    assert.ok(
      new RegExp(`const \\[${gate}, set`).test(source),
      `${gate} must exist as state, not just appear in the guard`,
    );
  }
  assert.match(source, /IntersectionObserver/, "inView comes from an observer on the strip");
  assert.match(source, /visibilitychange/);
});

test("a pointer held down is itself the pause, which is all a touch screen has", () => {
  assert.match(source, /setDragging\(true\)/, "pointerdown pauses the timer");
  assert.match(source, /setDragging\(false\)/, "and pointerup releases it");
  assert.ok(
    source.indexOf("setDragging(true)") < source.indexOf("function trackPointer"),
    "the pause happens on the way down, before any movement",
  );
});

test("a drag release goes through the same rebase as the timer, both directions", () => {
  assert.match(source, /slideTo\(next\)/, "the release must rebase, or the loop breaks after a swipe");

  const rebase = source.slice(source.indexOf("const rebase"), source.indexOf("const slideTo"));
  assert.match(
    rebase,
    /prev >= 2 \* n\) return prev - n/,
    "dragging forward past the middle copy rebases backwards",
  );
  assert.match(
    rebase,
    /prev < n\) return prev \+ n/,
    "and dragging back into the leading copy rebases forwards, which only a drag can do",
  );
});

test("reduced motion turns the slide into a jump but leaves the drag alone", () => {
  assert.match(
    source,
    /transition: swiping \? swipeTransition : "none"/,
    "the track's transition is gated",
  );
  assert.match(
    source,
    /swiping && motionAllowed/,
    "so is the cards' resize: a reduced-motion visitor gets no animated slide or resize",
  );
  assert.match(
    source,
    /const swipeTransition = motionAllowed/,
    "`swipeTransition` is where that gate lives",
  );
});
