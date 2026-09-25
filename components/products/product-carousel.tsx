"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CARD_GAP,
  CARD_SIZES,
  centerOfIndex,
  distanceTier,
  nearestIndex,
} from "@/components/products/carousel-geometry";
import { ProductTags } from "@/components/products/product-tags";
import { CARD_TAG_LIMIT } from "@/lib/products/tags";
import type { Product } from "@/lib/products/types";

// The card tiers, their offsets and the snap target live in `carousel-geometry.ts`, so the drag's
// arithmetic is testable without a DOM.

// Snappy, single easing for every animated property — no competing curves, no bounce.
const SWIPE_MS = 220;
const SWIPE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // expo-out: fast, decisive, no overshoot
// Total time per cycle (swipe + pause)
const CYCLE_MS = 2000;
// How many full copies of the product list a looping strip renders back-to-back. 3 guarantees the
// active card (always kept inside the middle copy) has real neighbour cards on both sides at every
// position, so the strip never has to jump across the array to loop.
//
// Below that, looping would mean showing the same product twice side by side, which reads as
// duplicate catalogue entries rather than as one product. With fewer than LOOP_COPIES products the
// strip therefore renders a single copy and does not auto-advance.
const LOOP_COPIES = 3;
// How far a pointer has to travel, horizontally and dominantly, before the gesture counts as a drag
// rather than as a press on the card underneath. Under it the strip snaps straight back and the link
// still navigates, so a click is never swallowed by a one-pixel hand tremor.
const DRAG_SLOP_PX = 10;

export function ProductCarousel({ products }: { products: Product[] }) {
  const n = products.length;
  // Loop only when there are enough products to fill the strip without repeating one immediately.
  const copies = n >= LOOP_COPIES ? LOOP_COPIES : 1;

  // Index into the extended strip. With copies, it starts at the first item of the middle copy so
  // the active card has neighbours on both sides; with a single copy it starts at the first card.
  // It only ever increases — RTL: the active card advances forward, so new cards are revealed on
  // the right and drift left through center, exiting on the left.
  const [activeExtIndex, setActiveExtIndex] = useState(() =>
    copies === 1 ? 0 : n,
  );
  // "swiping" true only during the slide transition, false during the pause
  const [swiping, setSwiping] = useState(false);
  // Auto-advance is motion, so it stays off until the visitor's preference is known (see below).
  const [motionAllowed, setMotionAllowed] = useState(false);
  // Hovering or focusing the strip stops it, giving every pointer and keyboard user a way to
  // hold a card still (WCAG 2.2.2 Pause, Stop, Hide).
  const [paused, setPaused] = useState(false);
  // A pointer that is down on the strip also holds it still. On a touch screen this is the *only*
  // pause there is: there is no hover to trigger the handlers above, and no keyboard focus either.
  const [dragging, setDragging] = useState(false);
  // Auto-advance is suspended while the strip is off screen and while the tab is in the background,
  // so it cannot burn through the catalogue where nobody can see it and hand the visitor a position
  // they did not choose when they arrive.
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  // Gesture bookkeeping. A ref, not state: pointermove runs at frame rate and the drag writes the
  // track's transform straight to the node, so a swipe never re-renders the strip's cards.
  const gestureRef = useRef<{
    id: number;
    x: number;
    y: number;
    axis: "none" | "x" | "y";
    moved: number;
  } | null>(null);
  // Set when a drag travelled far enough that the pointerup must not also click the card underneath.
  const suppressClickRef = useRef(false);

  // Honour `prefers-reduced-motion`, and keep following it if the visitor changes it mid-session.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Measure container width for the translateX calculation
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Is the strip on screen at all? A fifth of it is enough to count as being watched.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  /**
   * Puts the active card back inside the middle copy after a slide. The same product sits at the same
   * on-screen position before and after, so the reset itself is invisible.
   */
  const rebase = useCallback(() => {
    setActiveExtIndex((prev) => {
      if (copies === 1) return prev;
      if (prev >= 2 * n) return prev - n;
      if (prev < n) return prev + n;
      return prev;
    });
  }, [copies, n]);

  /** Slides to a specific index in the extended strip, then rebases. Used by the timer and a drag. */
  const slideTo = useCallback(
    (next: number) => {
      setSwiping(true);
      setActiveExtIndex(next);
      window.setTimeout(() => {
        setSwiping(false);
        rebase();
      }, SWIPE_MS);
    },
    [rebase],
  );

  useEffect(() => {
    if (copies === 1) return; // nothing to advance to without repeating a card
    if (!motionAllowed || !inView || !tabVisible || paused || dragging) return;
    const id = setInterval(() => {
      setSwiping(true);
      setActiveExtIndex((prev) => prev + 1);
      window.setTimeout(() => {
        setSwiping(false);
        // Once we've advanced into the trailing copy, silently rebase back into the middle copy. This
        // happens the instant the transition ends (transition is already "none" for this render), so
        // the reset itself is invisible — the same product sits at the same on-screen position before
        // and after, just at a lower extIndex.
        rebase();
      }, SWIPE_MS);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [copies, n, motionAllowed, inView, tabVisible, paused, dragging, rebase]);

  const extended = useMemo(
    () =>
      Array.from({ length: copies }, (_, copy) =>
        products.map((product, i) => ({
          product,
          key: `${product.id}-${copy}`,
          extIndex: copy * n + i,
        })),
      ).flat(),
    [products, n, copies],
  );

  /*
    The gesture, declared before the hooks that hold it.

    Everything the drag needs is known before the empty-catalogue return below — the derivations that
    used to sit after it are pure arithmetic over `containerWidth` and `activeExtIndex`, and `extended`
    is already memoised — so the handlers and the two effects that follow can live above it. Hooks may
    not sit below that return (Round 4 fixed exactly that fault here), and the linter also refuses a
    hook referring to a function declared later in the body, which is why the order is: derive, declare,
    then hold.
  */
  const activeCenterInTrack =
    containerWidth > 0 ? centerOfIndex(activeExtIndex, activeExtIndex) : 0;
  const trackTranslate = containerWidth / 2 - activeCenterInTrack;
  // Reduced motion turns the slide into a jump: the strip still follows a drag — that movement is the
  // visitor's, not ours — but it is not animated for them.
  const swipeTransition = motionAllowed
    ? `transform ${SWIPE_MS}ms ${SWIPE_EASE}`
    : "none";

  /**
   * Writes a translate straight to the node. `pointermove` runs at frame rate, and re-rendering the
   * strip's 3n cards on every one of them is work a drag does not need; the release then hands the
   * same values back to React, which computes them identically.
   */
  function moveTrackTo(px: number, transition: string) {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = transition;
    track.style.transform = `translateX(${px}px)`;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A pointer that is down holds the strip still. On a touch screen this is the only pause there
    // is: no hover, no keyboard focus, so without it the strip cannot be stopped at all.
    setDragging(true);
    suppressClickRef.current = false;
    gestureRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      axis: "none",
      moved: 0,
    };
  }

  function trackPointer(event: PointerEvent) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;

    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;

    if (gesture.axis === "none") {
      if (Math.abs(dx) < DRAG_SLOP_PX) return;
      // Vertical intent belongs to the page. `touch-action: pan-y` already hands that gesture to the
      // browser, which then cancels this pointer; this branch covers a mouse dragged downwards.
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.axis = "y";
        return;
      }
      gesture.axis = "x";
    }
    if (gesture.axis !== "x") return;

    gesture.moved = dx;
    suppressClickRef.current = true;
    moveTrackTo(trackTranslate + dx, "none");
  }

  /** Shared by pointerup and pointercancel: a cancelled gesture must put the strip back. */
  function endGesture(event: PointerEvent, cancelled: boolean) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    gestureRef.current = null;
    setDragging(false);

    if (cancelled || gesture.axis !== "x") {
      moveTrackTo(trackTranslate, "none");
      return;
    }

    // Where the drag left the strip: the strip coordinate now sitting under the middle of the window.
    const centre = activeCenterInTrack - gesture.moved;
    const next = nearestIndex(activeExtIndex, centre, extended.length);

    moveTrackTo(containerWidth / 2 - centerOfIndex(next, next), swipeTransition);
    slideTo(next);
  }

  function onClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    // The pointer travelled far enough that this was a drag, not a click on the card underneath, so
    // the card must not navigate after a swipe.
    event.preventDefault();
    event.stopPropagation();
  }

  // The newest handlers, so the window listeners below can be attached once per gesture and still
  // call closures that see the current width and index. Both are hoisted function declarations, so
  // holding them here does not evaluate anything early.
  const gestureApiRef = useRef({ trackPointer, endGesture });
  useEffect(() => {
    gestureApiRef.current = { trackPointer, endGesture };
  });

  /*
    A gesture is followed on the window, not by capturing the pointer on the strip.

    Capture is the obvious way to keep receiving movement when the pointer leaves the element, but it
    retargets `pointerup` to the capturing element — and the click that follows is dispatched to the
    nearest common ancestor of the down and up targets. With capture on the strip that ancestor is the
    strip rather than the card, so a plain tap on a product would stop navigating. Following on the
    window keeps the drag alive when a finger drifts off the strip and leaves the click target where
    it belongs.
  */
  useEffect(() => {
    if (!dragging) return;

    const move = (event: PointerEvent) => gestureApiRef.current.trackPointer(event);
    const up = (event: PointerEvent) => gestureApiRef.current.endGesture(event, false);
    const cancel = (event: PointerEvent) => gestureApiRef.current.endGesture(event, true);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [dragging]);

  if (n === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-8 text-sm text-[#71717a]">
        No products are available yet.
      </p>
    );
  }


  return (
    /*
      The strip is capped at the site's 1040px content column and centred, so it lines up with the
      hero above and the sections below at desktop widths. Below 1040 nothing binds and the carousel
      stays full-bleed, which is what it wants on a phone.

      The cap sits on the wrapper rather than on the measured element so that the nested body below
      keeps its indentation; the inner element is `w-full`, so it fills the capped box exactly and the
      ResizeObserver measures the same 1040 the cap produces. The flex centring this wrapper used to
      carry was doing nothing — the inner element is `w-full`, so `mx-auto` here is what centres it —
      and its `overflow-hidden` would have clipped any card that ever grows on hover.
    */
    <div className="mx-auto w-full max-w-[1040px]">
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden${dragging ? " select-none" : ""}`}
        /*
          `touch-action: pan-y` is what makes a horizontal drag possible on a touch screen: the browser
          keeps vertical panning (and the page's own scrolling) and hands horizontal movement to us.
          Without it the browser would take every touch gesture for a scroll and cancel our pointer.
        */
        style={{ height: CARD_SIZES.active.h + 64, touchAction: "pan-y" }} // 64 = py-8 top + bottom
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
      >
        {/* Sliding track */}
        <div
          ref={trackRef}
          className="absolute top-8 flex items-center"
          style={{
            left: 0,
            gap: CARD_GAP,
            transform: `translateX(${trackTranslate}px)`,
            // Slide smoothly during the swipe phase; snap instantly during the pause/reset phase.
            transition: swiping ? swipeTransition : "none",
            willChange: "transform",
          }}
        >
          {extended.map(({ product, key, extIndex }) => {
            const dist = Math.abs(extIndex - activeExtIndex);
            const tier = distanceTier(dist);
            const size = CARD_SIZES[tier];
            // Only one copy should be reachable by keyboard/AT — the filler copies exist purely to
            // make the loop seamless. With a single copy, every card is authoritative.
            const isAuthoritative =
              copies === 1 || (extIndex >= n && extIndex < 2 * n);

            return (
              <Link
                key={key}
                href={`/products/${product.slug}`}
                aria-hidden={isAuthoritative ? undefined : true}
                tabIndex={isAuthoritative ? undefined : -1}
                className="shrink-0 flex flex-col rounded-[32px] border border-[#e2e8f0] bg-[#f1f5f9] overflow-hidden"
                style={{
                  width: size.w,
                  height: size.h,
                  padding: size.p,
                  gap: size.innerGap,
                  // Card resize animates in lockstep with the track slide — same duration, same
                  // easing, so nothing lags or overshoots relative to anything else.
                  transition:
                    swiping && motionAllowed
                      ? `width ${SWIPE_MS}ms ${SWIPE_EASE}, height ${SWIPE_MS}ms ${SWIPE_EASE}, padding ${SWIPE_MS}ms ${SWIPE_EASE}`
                      : "none",
                }}
              >
                {/* Image */}
                <div
                  className="relative shrink-0 rounded-[20px] bg-[#e2e8f0] overflow-hidden"
                  style={{
                    width: size.img,
                    height: size.img,
                    transition:
                      swiping && motionAllowed
                        ? `width ${SWIPE_MS}ms ${SWIPE_EASE}, height ${SWIPE_MS}ms ${SWIPE_EASE}`
                        : "none",
                  }}
                >
                  <span className="sr-only">
                    {product.cardImageAlt ?? product.title}
                  </span>
                  {product.cardImageUrl ? (
                    <Image
                      src={product.cardImageUrl}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  ) : null}
                </div>

                {/* Text content */}
                <div
                  className="flex flex-col min-h-0 flex-1 overflow-hidden"
                  style={{ gap: size.innerGap }}
                >
                  <div
                    style={{
                      paddingLeft: size.p / 3,
                      paddingRight: size.p / 3,
                    }}
                  >
                    <p
                      className="font-bold text-[#3f3f46] leading-snug"
                      style={{ fontSize: size.fs }}
                    >
                      {product.title}
                    </p>
                    <p
                      className="mt-1 line-clamp-3 text-[#3f3f46] leading-snug"
                      style={{ fontSize: size.fsSmall }}
                    >
                      {product.description}
                    </p>
                  </div>

                  {/* Tags. The chip is the product page's chip at this card's tier, and a product
                      with more than three tags collapses the rest into a "+n" chip rather than
                      dropping them silently. */}
                  <ProductTags
                    tags={product.tags}
                    variant="card"
                    tier={tier}
                    limit={CARD_TAG_LIMIT}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Edge gradient fades — matches Figma's horizontal-gradient-light token
          (stops at 69.624% / rgba(241,245,249,0.8) and 88.304% / rgba(241,245,249,0)).
          Hidden on narrow viewports, where a 200px fade on each side covers the strip. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-30 hidden w-[200px] bg-gradient-to-r from-[#f1f5f9] via-[69.624%] via-[rgba(241,245,249,0.8)] to-[88.304%] to-[rgba(241,245,249,0)] lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-30 hidden w-[200px] bg-gradient-to-l from-[#f1f5f9] via-[69.624%] via-[rgba(241,245,249,0.8)] to-[88.304%] to-[rgba(241,245,249,0)] lg:block"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
