"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products/types";

const CARD_WIDTH = 190;
const CARD_GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.25;
const SCALE_RADIUS = 420; // px over which the scale falls off from center
const SPEED = 24; // px/sec — "slowly pans"

export function ProductCoverflow({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loopWidth = products.length * ITEM_WIDTH;
  // triple the sequence so there's always a full screen of cards on either side
  const sequence = [...products, ...products, ...products];

  useEffect(() => {
    if (products.length === 0) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf: number;
    let last = performance.now();

    const applyTransforms = () => {
      if (!trackRef.current || !containerRef.current) return;
      const containerCenter = containerRef.current.clientWidth / 2;
      const children = trackRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const el = children[i] as HTMLElement;
        const cardCenter = i * ITEM_WIDTH + ITEM_WIDTH / 2 + offsetRef.current;
        const distance = Math.abs(cardCenter - containerCenter);
        const t = Math.max(0, 1 - distance / SCALE_RADIUS);
        const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
        el.style.transform = `translateX(${offsetRef.current + i * ITEM_WIDTH}px) translateY(-50%) scale(${scale})`;
        el.style.zIndex = String(Math.round(scale * 100));
      }
    };

    if (prefersReducedMotion) {
      applyTransforms();
      return;
    }

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      offsetRef.current -= SPEED * dt;
      if (offsetRef.current <= -loopWidth) offsetRef.current += loopWidth;
      applyTransforms();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [products.length, loopWidth]);

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-8 text-sm text-[#71717a]">
        No products are available yet.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative h-118.5 w-full overflow-hidden">
      <div ref={trackRef} className="absolute left-0 top-1/2 h-0 w-0">
        {sequence.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            href={`/products/${product.slug}`}
            style={{ width: CARD_WIDTH }}
            className="group absolute top-1/2 flex flex-col gap-2.5 rounded-3xl border border-[#e2e8f0] bg-[#f1f5f9] p-2.5 will-change-transform"
          >
            <span
              aria-hidden="true"
              className="hover-gradient-stroke pointer-events-none absolute inset-0 rounded-[32px] p-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:linear-gradient(120deg,#00c290,#0fb8aa,#1fadc5,#00c290)] [background-size:300%_300%] [mask-composite:exclude] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
            />
            <div className="relative flex aspect-square items-center justify-center rounded-xl bg-[#e2e8f0]">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt=""
                  width={210}
                  height={210}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : null}
            </div>
            <div className="relative px-1 pb-2">
              <h3 className="text-xs font-bold text-[#3f3f46]">
                {product.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#3f3f46]">
                {product.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-[#00c290]/40 bg-gradient-to-b from-[#00c290]/30 via-[#0fb8aa]/30 to-[#1fadc5]/30 px-2.5 py-0.5"
                  >
                    <span className="bg-gradient-to-b from-[#00c290] via-[#0fb8aa] to-[#1fadc5] bg-clip-text text-[8px] font-medium text-transparent">
                      {tag}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-50 bg-gradient-to-r from-[#f1f5f9] via-[#f1f5f9]/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-50 bg-gradient-to-l from-[#f1f5f9] via-[#f1f5f9]/80 to-transparent"
      />
    </div>
  );
}
