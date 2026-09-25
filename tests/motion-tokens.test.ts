import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DISTANCE,
  DURATION,
  EASE_OUT,
  HERO_SCALE,
  MAX_STAGGER_STEPS,
  MOTION_ENABLED,
  PRESS_SCALE,
  STAGGER,
  logoDelay,
  staggerDelay,
} from "../components/motion/tokens.ts";
import {
  heroHeading,
  heroSupport,
  heroVisual,
  instant,
  logoReveal,
  panelDrop,
  revealFade,
  revealMove,
  revealRise,
  routeEnter,
} from "../components/motion/variants.ts";

/**
 * The motion system's rules, enforced rather than described.
 *
 * Motion does not appear in the Figma design, so the only thing standing between this pass and the
 * "four components, four slightly different animations" failure mode is that the numbers live in one
 * module and the rules below hold. These are the invariants that keep it coherent:
 *
 * - a duration that is long enough to feel slow is a bug, not a taste question;
 * - only composited properties are animated, so a reveal cannot cause layout shift;
 * - the hero cascade fades, but its measured element — the heading, which is the largest contentful
 *   paint on `/` and `/products` — takes the shortest fade and never a delay, because text at
 *   `opacity: 0` is not a valid LCP candidate and its duration *is* the LCP delay;
 * - `app/globals.css` repeats the same numbers for the CSS-only micro-interactions, and the two
 *   copies cannot drift apart.
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

/** The project's own source files, as project-relative POSIX paths. */
const sourceFiles = ["app", "components"]
  .flatMap((directory) => collectSourceFiles(path.join(projectRoot, directory)))
  .map((file) => path.relative(projectRoot, file).replace(/\\/g, "/"))
  .sort();

function cssToken(css: string, name: string): string | undefined {
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1].trim();
}

test("the whole system can be switched off from one value", () => {
  assert.equal(
    typeof MOTION_ENABLED,
    "boolean",
    "MOTION_ENABLED is the client's escape hatch; it must stay a plain boolean.",
  );
});

test("no duration is long enough to read as slow", () => {
  const bands: Record<keyof typeof DURATION, [number, number]> = {
    micro: [0.1, 0.2],
    fast: [0.15, 0.25],
    base: [0.25, 0.4],
    hero: [0.2, 0.3],
    reveal: [0.3, 0.6],
    enter: [0.15, 0.35],
    exit: [0.1, 0.25],
  };

  for (const [name, [min, max]] of Object.entries(bands)) {
    const value = DURATION[name as keyof typeof DURATION];
    assert.ok(
      value >= min && value <= max,
      `${name} is ${value}s, outside the documented ${min}-${max}s band. A 0.6s+ reveal with a ` +
        `stagger means the last card is still settling while the visitor scrolls past it.`,
    );
  }
});

test("leaving is quicker than arriving", () => {
  assert.ok(
    DURATION.exit < DURATION.enter,
    "an exit that takes as long as an entrance makes the interface feel like it is thinking.",
  );
});

test("every variant animates only composited properties", () => {
  const allowed = new Set(["opacity", "y", "scale", "transition"]);
  const sets: Array<[string, Record<string, unknown>]> = [
    ["revealRise(0)", revealRise(0)],
    ["revealFade(0)", revealFade(0)],
    ["revealMove(0)", revealMove(0)],
    ["heroHeading()", heroHeading()],
    ["heroSupport(1)", heroSupport(1)],
    ["heroVisual(3)", heroVisual(3)],
    ["logoReveal(7)", logoReveal(7)],
    ["routeEnter", routeEnter],
    ["panelDrop", panelDrop],
    ["instant(revealRise(0))", instant(revealRise(0))],
  ];

  let checked = 0;
  for (const [name, set] of sets) {
    for (const [state, value] of Object.entries(set)) {
      for (const property of Object.keys(value as Record<string, unknown>)) {
        checked += 1;
        assert.ok(
          allowed.has(property),
          `${name}.${state} animates "${property}". Only opacity and transform are composited; ` +
            `animating width, height, top, left, margin or padding causes layout work every frame.`,
        );
      }
    }
  }

  assert.ok(
    checked >= 16,
    `expected to inspect every variant state, inspected ${checked}`,
  );
});

test("the hero cascade fades, and exposes the measured element first", () => {
  for (const [name, set] of [
    ["heading", heroHeading()],
    ["support", heroSupport(0)],
    ["visual", heroVisual(0)],
  ] as const) {
    assert.equal(set.hidden.opacity, 0, `${name} should start transparent`);
    assert.equal(set.visible.opacity, 1, `${name} should end opaque`);
  }

  const heading = heroHeading().visible.transition;
  const support = heroSupport(1).visible.transition;
  const visual = heroVisual(3).visible.transition;

  assert.equal(
    heading.delay,
    0,
    "the heading is the largest contentful paint element, so it must never wait on a stagger; it " +
      "takes no index at all, which is what makes that structural rather than a convention.",
  );
  assert.ok(
    heading.duration < support.duration && heading.duration < visual.duration,
    "the heading must be the fastest element in the cascade: text at opacity 0 is not a valid LCP " +
      "candidate, so this duration is the LCP delay.",
  );
  assert.ok(
    heading.duration <= 0.3,
    `the heading fades in ${heading.duration}s, which pushes the measured paint too far past first paint.`,
  );

  assert.equal(
    "scale" in heroSupport(0).hidden,
    false,
    "only the hero visual scales; scaling supporting text is decoration.",
  );
  assert.equal(heroVisual(0).hidden.scale, HERO_SCALE);
  assert.equal(heroVisual(0).visible.scale, 1);

  assert.equal(revealRise(0).hidden.opacity, 0);
  assert.equal(revealFade(0).hidden.opacity, 0);
});

test("the hero cascade runs in the approved order and spacing", () => {
  const at = (index: number) => ({
    heading: heroHeading().visible.transition.delay,
    support: heroSupport(index).visible.transition.delay,
    visual: heroVisual(index).visible.transition.delay,
  });

  assert.equal(at(0).heading, 0);
  assert.equal(at(1).support, STAGGER, "the CTA starts one step after the heading");
  assert.equal(at(2).support, STAGGER * 2, "the eyebrow row starts one step after the CTA");
  assert.equal(at(3).visual, STAGGER * 3, "the hero visual is last, at 180ms");
  assert.equal(
    at(MAX_STAGGER_STEPS + 4).visual,
    Number((MAX_STAGGER_STEPS * STAGGER).toFixed(4)),
    "and the cascade stays bounded even if the visual is given a high index. The index has to sit " +
      "above the cap to test the cap, and the expectation is rounded the way `staggerDelay` rounds, " +
      "because 11 x 0.06 is 0.6600000000000001 in floating point.",
  );
});

test("the move reveal never fades, so it cannot multiply its children's opacity", () => {
  /*
    This variant exists for one composition: a bordered panel that moves into place while the tiles
    inside it fade. A container that faded as well would multiply its opacity by theirs for as long as
    the two overlap, and the tiles would come through dimmer than their own animation implies.
  */
  assert.equal("opacity" in revealMove(0).hidden, false);
  assert.equal("opacity" in revealMove(0).visible, false);
  assert.ok(
    "y" in revealMove(0).hidden,
    "it still moves: that is the whole point of it",
  );
});

test("the fade reveal moves nothing", () => {
  const moved = [revealFade(0).hidden, revealFade(0).visible].filter(
    (state) => "y" in state,
  );
  assert.deepEqual(
    moved,
    [],
    "revealFade is for elements whose position is shared with their neighbours — cells in a " +
      "seamless bordered grid, the sticky workspace card. It must not translate them.",
  );
});

test("the route wrapper never transforms", () => {
  const moved = [routeEnter.hidden, routeEnter.visible].filter(
    (state) => "y" in state,
  );
  assert.deepEqual(
    moved,
    [],
    "this wrapper contains a whole page, so a transform on it would become the containing block " +
      "for every fixed-position descendant — breaking a sticky header or overlay somewhere far from " +
      "the code that caused it.",
  );
});

test("a stagger stays bounded however long the list is", () => {
  // The expectation is rounded the way `staggerDelay` rounds: 11 x 0.06 is 0.6600000000000001 as a
  // double, so the raw product is not what the function returns.
  const capped = Number((MAX_STAGGER_STEPS * STAGGER).toFixed(4));

  assert.equal(staggerDelay(0), 0);
  assert.equal(staggerDelay(1), STAGGER);
  assert.equal(staggerDelay(MAX_STAGGER_STEPS), capped);
  assert.equal(
    staggerDelay(MAX_STAGGER_STEPS + 50),
    capped,
    "the cap has to bound an open-ended list: this is what stops a long one still settling long " +
      "after it entered the viewport",
  );
  assert.equal(staggerDelay(-3), 0, "a negative index must not produce a negative delay.");
  assert.ok(Number.isFinite(staggerDelay(1e9)));
});

test("the longest list in the application gives every item its own beat", () => {
  /*
    The cap is not an arbitrary number: it is set against the longest staggered list this application
    has, which is the twelve-cell business-features grid. It was eight while that grid held nine cells;
    at eight the tenth, eleventh and twelfth cells would share one delay and arrive as a block, which
    is the thing a stagger exists to avoid. Raising it costs tail time — twelve cells settle at about
    1.11s — and the client chose an individual beat per cell over the shorter total (Round 24).
  */
  const LONGEST_GRID = 12;
  const delays = Array.from({ length: LONGEST_GRID }, (_, index) => staggerDelay(index));

  assert.equal(delays[0], 0);
  assert.ok(
    MAX_STAGGER_STEPS >= LONGEST_GRID - 1,
    `a twelve-cell grid needs eleven distinct steps, but the cap is ${MAX_STAGGER_STEPS}`,
  );

  for (let index = 1; index < delays.length; index += 1) {
    assert.ok(
      delays[index] > delays[index - 1],
      `cell ${index + 1} shares its delay with cell ${index}: the wave stops and a block appears`,
    );
  }

  assert.ok(
    delays[delays.length - 1] + DURATION.reveal <= 1.15,
    "and the grid should still have settled soon enough that the last cell does not read as stalled",
  );
});

test("the logo sequence takes a smaller step than the general stagger", () => {
  assert.equal(logoDelay(0), 0, "the first logo must not wait");
  assert.ok(
    logoDelay(7) < staggerDelay(7),
    "the logo strip deliberately uses a tighter step than the general stagger: eight small marks in " +
      "one row read better as a quick ripple than as a slow wave",
  );
  assert.ok(
    logoDelay(7) <= 0.4,
    "its tail is bounded by the list itself rather than by the cap; this fails if the strip grows",
  );
  assert.equal(
    logoDelay(-2),
    0,
    "a negative index must not produce a negative delay.",
  );

  // The helpers above are only worth testing if the variants actually use them: these assertions are
  // what stop `logoReveal` quietly falling back to the general stagger.
  assert.equal(
    logoReveal(7).visible.transition.delay,
    logoDelay(7),
    "the logo variant must use its own sequence, not the general staggered one",
  );
  assert.equal(logoReveal(0).visible.transition.delay, 0);
  assert.equal(
    revealRise(3).visible.transition.delay,
    staggerDelay(3),
    "the general scroll reveal keeps using the capped helper",
  );
});

test("reduced motion removes the time, not the state", () => {
  const reduced = instant(revealRise(0));

  assert.equal(reduced.visible.transition.duration, 0);
  assert.equal(reduced.visible.transition.delay, 0);
  assert.equal(reduced.hidden.opacity, 0);
  assert.equal(reduced.visible.opacity, 1);
});

test("app/globals.css repeats the tokens exactly", () => {
  const css = read("app/globals.css");

  for (const name of Object.keys(DURATION) as Array<keyof typeof DURATION>) {
    const value = cssToken(css, `motion-duration-${name}`);
    assert.ok(value, `--motion-duration-${name} is missing from app/globals.css`);
    assert.match(value, /^\d+ms$/, `--motion-duration-${name} must be written in ms`);
    assert.equal(
      Number.parseFloat(value),
      Math.round(DURATION[name] * 1000),
      `--motion-duration-${name} has drifted from components/motion/tokens.ts`,
    );
  }

  assert.equal(
    cssToken(css, "motion-ease-out"),
    `cubic-bezier(${EASE_OUT.join(", ")})`,
  );
  assert.equal(cssToken(css, "motion-lift"), `${DISTANCE.lift}px`);
  assert.equal(cssToken(css, "motion-press-scale"), String(PRESS_SCALE));
});

test("the CSS micro-interactions use the tokens and stop for reduced motion", () => {
  const css = read("app/globals.css");

  assert.match(css, /\.motion-lift\s*\{[\s\S]*?--motion-duration-fast/);
  assert.match(css, /\.motion-press\s*\{[\s\S]*?--motion-duration-micro/);
  assert.match(
    css,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.motion-lift:hover/,
    "an unguarded :hover rule sticks to a tapped element on touch screens.",
  );

  const guards = css.split("@media (prefers-reduced-motion: reduce)");
  const lastGuard = guards[guards.length - 1] ?? "";
  assert.match(lastGuard, /\.motion-lift/);
  assert.match(lastGuard, /\.motion-press/);
  assert.match(lastGuard, /transform: none/);
});

test("the animation runtime never reaches the CMS", () => {
  const importers = sourceFiles.filter((file) =>
    /from\s+["']@\/components\/motion\//.test(read(file)),
  );

  assert.ok(
    importers.length >= 5,
    `expected the marketing pages to import the motion primitives, found: ${importers.join(", ")}`,
  );

  const cmsImporters = importers.filter(
    (file) => file.startsWith("app/(cms)") || file.startsWith("components/cms"),
  );
  assert.deepEqual(
    cmsImporters,
    [],
    "the CMS has no animation, so the runtime must stay out of it: the provider belongs in " +
      "app/(marketing)/layout.tsx, not in the root layout.",
  );
});

test("the provider is mounted once, by the marketing layout", () => {
  const mounting = sourceFiles.filter((file) =>
    /<MotionProvider/.test(read(file)),
  );

  assert.deepEqual(mounting, ["app/(marketing)/layout.tsx"]);
});

test("the reveal primitives cannot render a link", () => {
  const source = read("components/motion/reveal.tsx");
  const tags = /const TAGS = \{([\s\S]*?)\} as const;/.exec(source)?.[1] ?? "";

  assert.match(tags, /section: m\.section/);
  assert.match(tags, /li: m\.li/);
  assert.doesNotMatch(
    tags,
    /\ba: m\.a/,
    "these are motion elements, not Next <Link>s. Rendering an anchor through one would silently " +
      "replace client-side navigation with a full page load.",
  );
  assert.match(
    source,
    /data-reveal=""/,
    "the no-JavaScript fallback in app/layout.tsx targets [data-reveal].",
  );

  // And the sanctioned route for a link, which is needed where the link *is* the grid item.
  assert.ok(
    read("components/motion/reveal-link.tsx").includes("m.create(Link)"),
    "links that are themselves grid items animate through m.create(Link); the alternative — wrapping " +
      "one in a motion div — would move its grid placement onto the wrapper",
  );
});

test("the light entry point is used, and the heavy one is not", () => {
  const provider = read("components/motion/provider.tsx");
  assert.match(provider, /features=\{domAnimation\}/, "domMax would add 10 KB for nothing.");
  assert.match(provider, /strict/, "without strict, `motion.div` can creep back in unnoticed.");

  const offenders = sourceFiles.filter((file) => {
    const source = read(file);
    return (
      /<motion\./.test(source) ||
      /import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*["']motion\/react["']/.test(source) ||
      /from\s+["']framer-motion["']/.test(source)
    );
  });

  assert.deepEqual(
    offenders,
    [],
    "import the `m` component from motion/react-m instead: the full `motion` component ships " +
      "34 KB gzipped against roughly 20 KB for the lazy entry point.",
  );
});

test("every component that animates honours the kill switch", () => {
  const animated = sourceFiles.filter((file) =>
    /from\s+["']motion\/react-m["']/.test(read(file)),
  );

  assert.ok(
    animated.length >= 3,
    `expected to find the components that animate, found: ${animated.join(", ")}`,
  );

  const offenders = animated.filter((file) => !/MOTION_ENABLED/.test(read(file)));
  assert.deepEqual(
    offenders,
    [],
    "with MOTION_ENABLED false there is no LazyMotion in the tree, so an element left with " +
      "`initial` and no features to animate it would stay stuck at its hidden state — an invisible " +
      "navigation panel, in the one component this actually happened to.",
  );
});

test("the no-JavaScript fallback stays in the root layout", () => {
  const layout = read("app/layout.tsx");

  assert.match(layout, /<noscript/);
  assert.match(layout, /\[data-reveal\]\{opacity:1!important;transform:none!important\}/);
});
