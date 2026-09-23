"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useHasScrolled } from "@/components/motion/use-has-scrolled";

/**
 * The hero demo video, embedded from YouTube and driven by scroll.
 *
 * What the visitor gets: nothing on load but the (hidden) box — the player is not created at all, so
 * no YouTube script, requests or playback happen until they scroll. On that first scroll the box
 * reveals and the player appears **paused**, which is what they see while scrolling rather than a
 * poster. It plays once the whole box is in frame, pauses as soon as it is not, and resumes when it
 * is again.
 *
 * Five things here are deliberate, not decorative:
 *
 * - **`loop` needs `playlist`.** YouTube loops a single video only when `playlist` names the same
 *   video; `loop=1` on its own plays once and stops. Both are set from one variable.
 * - **The player is created paused, not playing.** `autoplay=0` plus a `playVideo` command at the
 *   right moment is what makes "paused while scrolling" possible at all; with `autoplay=1` the video
 *   would start the instant the iframe existed.
 * - **Playback follows full visibility.** The client asked for playback to begin only when the whole
 *   box is in frame, and to pause on any scroll away from that — so the trigger is the element itself
 *   being entirely on screen, not a fraction of it.
 * - **The scroll threshold is required, not just visibility.** The hero box is in the first screen on
 *   both desktop and mobile, so "play when visible" fires on load. Nothing starts until the visitor
 *   has actually scrolled.
 * - **It can still be stopped.** An autoplay loop that runs beside other content for more than five
 *   seconds needs a mechanism to pause it (WCAG 2.2.2, Level A). The control is hidden at rest — the
 *   client asked for a clean hero — and appears on hover or keyboard focus. That keeps it reachable
 *   for keyboard and assistive-technology users; it does cost discoverability for a pointer user who
 *   wants to stop the video without touching the keyboard, which is a trade recorded in the docs.
 *
 * Visitors who asked for reduced motion get no automatic playback at all: the poster is a button, and
 * once they have pressed it the video plays — and still pauses when it leaves the frame.
 *
 * Known and accepted: YouTube's own title overlay and logo cannot be removed any more —
 * `modestbranding` and `showinfo` are deprecated — so the embed carries YouTube branding.
 */

/** One constant, so the embed URL and the origin scripted control posts to cannot disagree. */
const YOUTUBE_EMBED_ORIGIN = "https://www.youtube.com";

/**
 * How much of the box must be on screen before the player is created, and before it plays.
 *
 * `MOUNT_AMOUNT` matches the box's own reveal, so the paused video is what appears rather than the
 * poster. `PLAY_AMOUNT` is the whole box: the client asked for playback to begin only once the video
 * is fully in frame.
 *
 * The consequence worth knowing: on a window shorter than the box itself (under ~700px tall on
 * desktop, or a landscape phone) the whole box can never be in frame, so playback will not start on
 * its own there. The control still works — it appears on hover or keyboard focus — and the video
 * pauses again as soon as it leaves that state.
 *
 * The scroll threshold that gates all of this lives with the latch itself, in
 * `components/motion/use-has-scrolled.ts`, so the reveal of the box and the creation of the player
 * cannot disagree about when the visitor has begun scrolling.
 */
const MOUNT_AMOUNT = 0.2;
const PLAY_AMOUNT = 1;

/** Nothing to subscribe to: the embedding origin never changes within a page. */
const noSubscription = () => () => {};

/**
 * The page's own origin, read on the client only.
 *
 * `useSyncExternalStore` rather than state in an effect: it is the supported way to read a
 * client-only value without a hydration mismatch, and it returns the empty string while server
 * rendering, which is what tells this component the player cannot be created yet.
 */
function useEmbeddingOrigin(): string {
  return useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => "",
  );
}

/** The state before the player exists: nothing loaded yet, and without JavaScript nothing will be. */
function PosterGlyph() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#212121]">
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 3.5v11l10-5.5z" fill="#ffffff" />
      </svg>
    </span>
  );
}

export function HeroVideoEmbed({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const reducedMotion = useReducedMotion();
  const origin = useEmbeddingOrigin();
  const hasScrolled = useHasScrolled();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  /*
    The player is created — paused — as soon as the box is on screen after a scroll, which is the same
    moment the box itself reveals. That is deliberate: the client does not want to see the poster in
    place of the video, so the poster's life ends the moment scrolling begins and what appears instead
    is the paused video, which then plays once the whole box is in frame.
  */
  const boxVisible = useInView(boxRef, { amount: MOUNT_AMOUNT });
  const fullyInFrame = useInView(boxRef, { amount: PLAY_AMOUNT });
  const [requested, setRequested] = useState(false);
  const [intent, setIntent] = useState<"auto" | "play" | "pause">("auto");

  // Reduced motion: nothing plays until the visitor asks. Everyone else: the video earns a scroll.
  const mayMount = reducedMotion ? requested : hasScrolled;
  const mounted = origin !== "" && mayMount && boxVisible;

  /*
    The rule the client asked for: play only while the whole box is in frame, and pause on any scroll
    away from that, including out of view. A deliberate press of play still wins — otherwise the
    control would look broken when the box is not completely in frame — but only while the box is on
    screen at all, so scrolling past it cannot leave the video running where nobody can see it.

    Playback is derived rather than stored, so there is one source of truth for both the video and the
    icon on the control.
  */
  const playing =
    mounted && intent !== "pause" && (fullyInFrame || (intent === "play" && boxVisible));

  /*
    The poster belongs to the states that have no player and no scroll yet: a no-JavaScript visitor,
    and a reduced-motion visitor who has not pressed play. Once scrolling has begun it is gone, which
    is what keeps it out of the way while the player loads.
  */
  const showPoster = reducedMotion ? !requested : !hasScrolled;

  function command(func: "playVideo" | "pauseVideo") {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      YOUTUBE_EMBED_ORIGIN,
    );
  }

  /*
    This effect only tells the player what the derived state already says, so it never sets state
    itself. Its first run arrives alongside the freshly created player, which starts paused, so the
    command it sends is the whole point rather than a duplicate.
  */
  useEffect(() => {
    if (!mounted) return;
    command(playing ? "playVideo" : "pauseVideo");
  }, [mounted, playing]);

  const src = `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}?${new URLSearchParams({
    autoplay: "0",
    mute: "1",
    loop: "1",
    playlist: videoId,
    controls: "0",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
    ...(origin ? { origin } : {}),
  }).toString()}`;

  return (
    <div
      ref={boxRef}
      className="group absolute inset-0 flex items-center justify-center"
    >
      {mounted ? (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : showPoster && reducedMotion ? (
        /* Their choice to make: no automatic playback, and a real control to start it. */
        <button
          type="button"
          onClick={() => {
            setRequested(true);
            setIntent("play");
          }}
          className="flex flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          <PosterGlyph />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#424242]">
            Play the product demo
          </span>
        </button>
      ) : showPoster ? (
        /*
          A no-JavaScript visitor, who never gets a player: the root layout's noscript rule is what
          makes this box visible at all. Deliberately not a button, because it could never work.
        */
        <div className="flex flex-col items-center gap-2">
          <PosterGlyph />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#424242]">
            Product demo
          </p>
        </div>
      ) : null}

      {mounted ? (
        <button
          type="button"
          onClick={() =>
            setIntent((current) => (playing || current === "play" ? "pause" : "play"))
          }
          aria-label={playing ? "Pause the product demo" : "Play the product demo"}
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
          >
            {playing ? (
              <>
                <rect x="2" y="1.5" width="3.5" height="11" rx="1" />
                <rect x="8.5" y="1.5" width="3.5" height="11" rx="1" />
              </>
            ) : (
              <path d="M3 1.5v11l9-5.5z" />
            )}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
