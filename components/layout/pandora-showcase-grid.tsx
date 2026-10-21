import Image from "next/image";
import { RevealLink } from "@/components/motion/reveal-link";
import { EMPTY_TILE, SHOWCASE_SLOTS, type ShowcaseSlot } from "@/lib/content/showcase";
import type { ShowcaseTile } from "@/lib/content/types";

/**
 * The nine-tile PANDORA showcase.
 *
 * The panel's **geometry is code**: nine slots in `SHOWCASE_SLOTS`, two of them two columns wide, one
 * two rows tall, six single, and their placements are hand-written `lg:col-start-*` classes. Only the
 * label and the photograph come from the CMS (`/cms/home`, section 6), which is why the tile count is
 * fixed at nine — the server can express nine labels, not nine positions.
 *
 * The exported photographs were paired to those shapes by aspect ratio, because nothing in their
 * metadata said which feature each belonged to: two are twice as wide as they are tall, one is taller
 * than it is wide, and six are single-tile shaped — exactly the panel's composition. That pairing is
 * now an instruction to the author instead ("Wide, about 1400 × 546 px" beside the upload) and a test
 * checks every stored image's real dimensions against its slot's shape.
 *
 * The photographs are marked decorative (`alt=""`) rather than described: the label beside each one
 * already names the feature, and the alternative would be alt text invented for pictures nobody here
 * has seen.
 *
 * Aspect ratios, measured rather than assumed: the two wide assets are 2.15:1 against a tile that is
 * 2.56:1, the tall one is 1:1.67 against 1:1.56, and the six singles run 1.10–1.62:1 against a tile of
 * about 1.28:1. `object-cover` therefore trims up to 21% from the widest of them and under 7% from
 * most.
 */

function ShowcaseCell({
  tile,
  slot,
  index,
}: {
  tile: ShowcaseTile;
  slot: ShowcaseSlot;
  index: number;
}) {
  const isDark = slot.variant === "dark";
  return (
    <RevealLink
      href="#"
      index={index}
      /*
        Fade only, for the same reason as the feature grid: these tiles share their 1px rules with
        their neighbours, so moving one would pull the panel's edges apart mid-animation.
      */
      variant="fade"
      className={`group relative flex min-h-[220px] items-end overflow-hidden border ${
        isDark ? "border-[#27272a]" : "border-[#e5e7eb]"
      } lg:h-full lg:min-h-0 ${slot.gridClassName}`}
    >
      {/* Base surface: the photo covers it, and it is what remains if the image cannot load. */}
      <div
        className={`absolute inset-0 ${isDark ? "bg-[#27272a]" : "bg-[#f1f5f9]"}`}
        aria-hidden="true"
      />

      {tile.imageUrl ? (
        <Image
          src={tile.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
        />
      ) : null}

      {/* The wash that keeps the label readable over a photograph. */}
      {isDark ? (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black from-[21.502%] to-[rgba(39,39,42,0)] to-[80.548%]"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-[70.192%] to-[#f1f5f9]/0"
          aria-hidden="true"
        />
      )}

      <span
        className={`relative flex items-center gap-2 px-6 py-4 text-lg font-semibold transition-opacity group-hover:opacity-80 ${
          isDark ? "text-white" : "text-[#18181b]"
        }`}
      >
        {tile.label}
      </span>
    </RevealLink>
  );
}

export function PandoraShowcaseGrid({ tiles }: { tiles: ShowcaseTile[] }) {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[30px] border border-[#e5e7eb] lg:h-[1082px] lg:grid-cols-3 lg:grid-rows-4">
      {SHOWCASE_SLOTS.map((slot, index) => (
        <ShowcaseCell
          key={slot.id}
          tile={tiles[index] ?? EMPTY_TILE}
          slot={slot}
          index={index}
        />
      ))}
    </div>
  );
}
