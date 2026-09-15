"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products/types";

const HIGHLIGHT_INTERVAL_MS = 2000;
const BASE_CARD_WIDTH = 189; // matches Figma's smallest card (188.8px)
const SCALE_STEP = 0.125; // Figma progression: 1 / 1.125 / 1.25
const MAX_SCALE_DISTANCE = 2; // cards 2+ away from active stay at base size

function scaleForDistance(distance: number) {
  const steps = Math.max(MAX_SCALE_DISTANCE - distance, 0);
  return 1 + steps * SCALE_STEP;
}

export function ProductCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(products.length - 1);

  useEffect(() => {
    if (products.length <= 1) return;
    const id = setInterval(() => {
      // RTL: active index moves right -> left, wrapping around
      setActiveIndex(
        (current) => (current - 1 + products.length) % products.length,
      );
    }, HIGHLIGHT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [products.length]);

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-8 text-sm text-[#71717a]">
        No products are available yet.
      </p>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center gap-4 overflow-x-auto py-8">
        {products.map((product, index) => {
          const rawDistance = Math.abs(index - activeIndex);
          const distance = Math.min(rawDistance, products.length - rawDistance);
          const scale = scaleForDistance(distance);

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              style={{
                width: BASE_CARD_WIDTH,
                transform: `scale(${scale})`,
                zIndex: 10 - distance,
              }}
              className="flex shrink-0 origin-center flex-col gap-2.5 rounded-[32px] border border-[#e2e8f0] bg-transparent p-2.5 transition-transform duration-150 ease-out will-change-transform"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-[#e2e8f0]">
                <span className="sr-only">
                  {product.imageAlt ?? product.title}
                </span>
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    className="object-contain"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1 pb-4">
                <h2 className="px-1 text-center text-xs font-bold text-[#3f3f46]">
                  {product.title}
                </h2>
                <p className="line-clamp-3 px-1 text-center text-[10px] leading-4 text-[#52525b]">
                  {product.description}
                </p>
                <div className="flex flex-wrap justify-center gap-1 py-1">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[#00c290]/40 bg-gradient-to-b from-[#00c290]/30 via-[#0fb8aa]/30 to-[#1fadc5]/30 px-2 py-0.5 text-[8px] font-medium text-[#0e8e8f]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[120px] bg-gradient-to-r from-[#f1f5f9] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[120px] bg-gradient-to-l from-[#f1f5f9] to-transparent" />
    </div>
  );
}
