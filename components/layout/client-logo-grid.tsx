import { RevealImage } from "@/components/motion/reveal-image";
import type { ClientLogo } from "@/lib/content/types";

/**
 * The client logo grid, drawn twice from one list.
 *
 * The logos are homepage content now (`/cms/home`, section 4) and the hero strip and the "Our Clients"
 * marquee both render this component with the same array — they are one list shown in two places, not
 * two lists that happen to match. The success-story carousel draws on the same brand names but is
 * deliberately **not** a consumer of this module: those are stories with their own order and their own
 * logo uploads. See `success-stories-carousel.tsx`.
 *
 * The two contexts differ in three ways, and all three are reproduced here rather than normalised:
 * the gaps, the image class, and how each logo is centred in its cell.
 *
 * Normalising them would be a visual change to one of the two places, and this workspace has no
 * browser in which to judge it. Reconciling them is a design decision, not a refactor.
 *
 * - `hero` — the strip under the hero video. Each logo sits inside a centring wrapper, which is a flex
 *   box and therefore stretches to the cell its logo is centred inside.
 * - `marquee` — the overlay grid on the "Our Clients" panel. The logos *are* the grid items, so the
 *   centring has to be the grid's own: `justify-items-center`. Without it they are not centred at
 *   all — a grid item that is a replaced element with an intrinsic size and aspect ratio aligns to
 *   `start` rather than stretching, so every logo was packed against the left edge of its cell while
 *   the cell itself stayed as wide as the widest logo (the client-reported fault on mobile, and it
 *   was present at every width). `items-center` only ever governed the block axis, which is why it
 *   looked like centring was already handled. It also carries `opacity-90` because it sits over
 *   moving rows.
 */
const VARIANTS = {
  hero: {
    grid: "grid grid-cols-2 items-center gap-x-10 gap-y-6 sm:grid-cols-4",
    image: "h-auto w-auto",
    centreEachLogo: true,
  },
  marquee: {
    grid: "grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-4 sm:grid-cols-4",
    image: "h-auto max-h-8 w-auto opacity-90",
    centreEachLogo: false,
  },
} as const;

export type ClientLogoGridVariant = keyof typeof VARIANTS;

/**
 * Both grids reveal their logos one after another as the strip enters the viewport: opacity and a
 * short rise, 50ms apart, once. `RevealImage` carries that, so the mapping stays here and neither
 * context's markup changes — see `components/motion/reveal-image.tsx` for why the image animates
 * rather than a wrapper around it.
 */
export function ClientLogoGrid({
  variant,
  logos,
}: {
  variant: ClientLogoGridVariant;
  logos: ClientLogo[];
}) {
  const { grid, image, centreEachLogo } = VARIANTS[variant];

  return (
    <div className={grid}>
      {logos.map((logo, index) => (
        <RevealImage
          key={`${logo.imageUrl}-${index}`}
          src={logo.imageUrl}
          alt={logo.name}
          width={logo.width}
          height={logo.height}
          className={image}
          index={index}
          centred={centreEachLogo}
        />
      ))}
    </div>
  );
}
