import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The hero video embed.
 *
 * A client component cannot be rendered here, so these are static checks over the two files — but
 * each one guards a documented YouTube behaviour, a scroll rule or an accessibility requirement that
 * would be easy to lose in an edit:
 *
 * - `loop=1` alone does not loop a single video; it needs `playlist` naming the same video, and
 *   getting that wrong looks like a broken hero rather than a bug;
 * - the hero box is in the first screen, so "play when visible" is autoplay on load — the scroll
 *   threshold is what makes the client's "hide it until you scroll" actually true;
 * - an autoplay loop running beside other content needs a pause mechanism (WCAG 2.2.2, Level A);
 * - a visitor who asked for reduced motion must not be given automatic playback.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const SECTION = "components/layout/hero-video-section.tsx";
const EMBED = "components/layout/hero-video-embed.tsx";
const HOOK = "components/motion/use-has-scrolled.ts";
const REVEAL = "components/motion/reveal.tsx";

test("the embed pair for loop is complete, and the YouTube chrome is off", () => {
  const source = read(EMBED);

  assert.ok(source.includes('loop: "1"'), "the hero video is meant to loop");
  assert.ok(
    source.includes("playlist: videoId"),
    "loop=1 alone plays a single video once; YouTube only loops when playlist names the same video",
  );
  assert.ok(
    source.includes('mute: "1"'),
    "browsers refuse to autoplay a video with sound, so muted is not optional",
  );
  assert.ok(source.includes('playsinline: "1"'), "iOS takes over the screen without playsinline");
  assert.ok(
    source.includes('controls: "0"'),
    "YouTube's own control bar must stay off: the hero shows no player chrome",
  );
});

test("nothing plays until the visitor scrolls", () => {
  const embed = read(EMBED);
  const hook = read(HOOK);

  assert.ok(
    hook.includes("SCROLL_THRESHOLD_PX") && hook.includes("window.scrollY > threshold"),
    "the hero is in the first screen, so visibility alone would start playback on load — the scroll " +
      "threshold is what makes 'hidden until you scroll' true rather than decorative",
  );
  assert.ok(
    hook.includes("removeEventListener"),
    "the latch removes its own listener once it has fired: after that the answer never changes",
  );
  assert.ok(
    embed.includes("useHasScrolled") && embed.includes("@/components/motion/use-has-scrolled"),
    "the reveal and the playback must share one threshold, or the box would appear and start playing " +
      "at different moments",
  );
  assert.ok(
    /origin !== "" && mayMount/.test(embed),
    "the player is created only when the origin is known *and* the visitor may start it",
  );
});

test("the box is hidden on load and reveals on the first scroll", () => {
  const section = read(SECTION);
  const reveal = read(REVEAL);

  assert.ok(
    section.includes("<ScrollReveal") && section.includes('as="div"'),
    "the video box itself carries the reveal, as the same element rather than an extra wrapper",
  );
  assert.ok(
    reveal.includes("export function ScrollReveal"),
    "the primitive has to exist: a plain viewport reveal fires at hydration for an element already " +
      "on screen, which is a mount animation with extra steps",
  );
  assert.ok(
    reveal.includes("hasScrolled && inView") && reveal.includes("once: true"),
    "the scroll latch gates the reveal, and `once` keeps the in-view half one-way so the box cannot " +
      "disappear again when the visitor scrolls back past it",
  );
});

test("it plays only while the whole box is in frame", () => {
  const source = read(EMBED);

  const play = Number(/PLAY_AMOUNT = ([\d.]+)/.exec(source)?.[1]);
  const mount = Number(/MOUNT_AMOUNT = ([\d.]+)/.exec(source)?.[1]);

  assert.equal(
    play,
    1,
    "the client asked for playback to begin only once the video is fully in frame",
  );
  assert.ok(
    mount > 0 && mount < play,
    "the player has to be created before it can play, or the poster would be what appears while " +
      "scrolling — which is the thing this change removes",
  );
  assert.ok(
    source.includes('autoplay: "0"'),
    "the player must be created paused: with autoplay=1 it starts the moment the iframe exists, " +
      "before the box is fully in frame",
  );
  assert.ok(
    source.includes('fullyInFrame || (intent === "play" && boxVisible)'),
    "playback follows full visibility, with a deliberate press of play winning while the box is on " +
      "screen at all",
  );
  assert.ok(
    source.includes('mounted && intent !== "pause"'),
    "playback is derived, so scrolling back into frame resumes it instead of needing a reload",
  );
  assert.ok(
    source.includes("userPaused") === false,
    "the old two-threshold model is gone: the rule is now full visibility, not a hysteresis band",
  );
});

test("the poster is not what you see while scrolling", () => {
  const source = read(EMBED);

  assert.ok(
    source.includes("const showPoster = reducedMotion ? !requested : !hasScrolled"),
    "the poster belongs to the no-JavaScript and reduced-motion states only: once scrolling begins " +
      "the paused video is what appears, not the placeholder",
  );
});

test("the control is hidden at rest and reachable by keyboard", () => {
  const source = read(EMBED);

  assert.ok(source.includes("opacity-0"), "the client asked for a hero with no visible controls");
  assert.ok(
    source.includes("group-hover:opacity-100") && source.includes("focus-visible:opacity-100"),
    "hidden is not absent: WCAG 2.2.2 needs a mechanism to stop the loop, so the control must come " +
      "back on hover and on keyboard focus",
  );
  assert.ok(
    source.includes("aria-label={playing ?"),
    "the control's name has to follow its state, and it must exist for assistive technology even " +
      "while it is visually hidden",
  );
});

test("reduced motion is honoured, and the pause path stays scriptable", () => {
  const source = read(EMBED);

  assert.ok(
    source.includes("useReducedMotion") && source.includes("reducedMotion ? requested : hasScrolled"),
    "reduced motion means no automatic playback: the poster is a button and playback is their choice",
  );
  assert.ok(
    source.includes("Pause the product demo"),
    "an autoplay loop beside other content needs a pause control (WCAG 2.2.2, Level A)",
  );
  assert.ok(
    source.includes('command(playing ? "playVideo" : "pauseVideo")') &&
      source.includes('enablejsapi: "1"'),
    "scripted pause needs the JS API flag, the embedding origin, and a command that covers both " +
      "directions",
  );
});

test("the player is created on the client, so the origin can be sent", () => {
  const source = read(EMBED);

  assert.ok(
    source.includes("window.location.origin"),
    "YouTube wants the embedding origin in the URL for scripted control",
  );
  assert.ok(
    source.includes("useSyncExternalStore"),
    "the origin is a client-only value: reading it through useSyncExternalStore avoids both a " +
      "hydration mismatch and setting state inside an effect",
  );
  assert.ok(
    source.includes("title={title}"),
    "an iframe needs an accessible name or it announces as an unlabelled frame",
  );
});

test("the hero section still keeps its placeholder id", () => {
  const source = read(SECTION);

  assert.ok(
    source.includes("REPLACE_WITH_YOUTUBE_VIDEO_ID"),
    "the placeholder id is the mechanism that returns the hero to its poster state with no other change",
  );
  assert.ok(
    source.includes("hasVideo") && source.includes("<HeroVideoEmbed"),
    "the embed has to be conditional on a configured id",
  );
  assert.ok(
    source.includes("Product Demo / Hero Video Placeholder"),
    "the poster state is what shows when no id is configured, so it must stay",
  );
});
