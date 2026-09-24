"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products/types";

// Figma exact pixel sizes — 3 tiers based on distance from the active card
const SIZES = {
  active: {
    w: 236,
    h: 442,
    img: 210,
    p: 12,
    innerGap: 6,
    fs: 16,
    fsSmall: 12.8,
    fsTag: 10,
    tagPx: 12,
  },
  adjacent: {
    w: 212.4,
    h: 397.8,
    img: 189,
    p: 10.8,
    innerGap: 5.4,
    fs: 14.4,
    fsSmall: 11.5,
    fsTag: 9,
    tagPx: 10.8,
  },
  rest: {
    w: 188.8,
    h: 353.6,
    img: 168,
    p: 9.6,
    innerGap: 4.8,
    fs: 12.8,
    fsSmall: 10.2,
    fsTag: 8,
    tagPx: 9.6,
  },
} as const;

type SizeKey = keyof typeof SIZES;

// Fixed gap between every card (Figma: gap-[16px])
const CARD_GAP = 16;
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

function distanceTier(dist: number): SizeKey {
  if (dist === 0) return "active";
  if (dist === 1) return "adjacent";
  return "rest";
}

// Sum of card widths + gaps preceding `index` in the flat (non-wrapping) extended strip.
function offsetOfIndex(activeIndex: number, index: number) {
  let x = 0;
  for (let i = 0; i < index; i++) {
    x += SIZES[distanceTier(Math.abs(i - activeIndex))].w + CARD_GAP;
  }
  return x;
}

// Center of card[index] within the strip, for a given activeIndex.
function centerOfIndex(activeIndex: number, index: number) {
  const w = SIZES[distanceTier(Math.abs(index - activeIndex))].w;
  return offsetOfIndex(activeIndex, index) + w / 2;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  useEffect(() => {
    if (copies === 1) return; // nothing to advance to without repeating a card
    const id = setInterval(() => {
      setSwiping(true);
      setActiveExtIndex((prev) => prev + 1);
      setTimeout(() => {
        setSwiping(false);
        // Once we've advanced into the trailing copy, silently rebase back into the middle
        // copy. This happens the instant the transition ends (transition is already "none"
        // for this render), so the reset itself is invisible — the same product sits at the
        // same on-screen position before and after, just at a lower extIndex.
        setActiveExtIndex((prev) => (prev >= 2 * n ? prev - n : prev));
      }, SWIPE_MS);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [copies, n, motionAllowed, paused]);

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

  if (n === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-8 text-sm text-[#71717a]">
        No products are available yet.
      </p>
    );
  }

  const activeCenterInTrack =
    containerWidth > 0 ? centerOfIndex(activeExtIndex, activeExtIndex) : 0;
  const trackTranslate = containerWidth / 2 - activeCenterInTrack;

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
        className="relative w-full overflow-hidden"
        style={{ height: SIZES.active.h + 64 }} // 64 = py-8 top + bottom
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Sliding track */}
        <div
          className="absolute top-8 flex items-center"
          style={{
            left: 0,
            gap: CARD_GAP,
            transform: `translateX(${trackTranslate}px)`,
            // Slide smoothly during the swipe phase; snap instantly during the pause/reset phase.
            transition: swiping
              ? `transform ${SWIPE_MS}ms ${SWIPE_EASE}`
              : "none",
            willChange: "transform",
          }}
        >
          {extended.map(({ product, key, extIndex }) => {
            const dist = Math.abs(extIndex - activeExtIndex);
            const tier = distanceTier(dist);
            const size = SIZES[tier];
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
                  transition: swiping
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
                    transition: swiping
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

                  {/* Tags */}
                  <div
                    className="flex flex-wrap"
                    style={{
                      gap: size.innerGap,
                      paddingTop: size.innerGap / 2,
                    }}
                  >
                    {product.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-[#00c290]/40 bg-gradient-to-b from-[rgba(0,194,144,0.3)] via-[rgba(15,184,170,0.3)] to-[rgba(31,173,197,0.3)]"
                        style={{
                          paddingLeft: size.tagPx,
                          paddingRight: size.tagPx,
                          paddingTop: 1,
                          paddingBottom: 1,
                        }}
                      >
                        <span
                          className="bg-gradient-to-b from-[#00c290] via-[#0fb8aa] to-[#1fadc5] bg-clip-text font-medium text-transparent whitespace-nowrap"
                          style={{ fontSize: size.fsTag }}
                        >
                          {tag}
                        </span>
                      </span>
                    ))}
                  </div>
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
