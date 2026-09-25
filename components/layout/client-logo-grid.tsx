import { RevealImage } from "@/components/motion/reveal-image";

/**
 * The eight client logos, in one place, mapped by both grids that show them.
 *
 * They used to be declared twice — once in the hero strip and once over the client marquee — as two
 * byte-identical lists, which meant a ninth client needed editing in two files. The success-story
 * carousel also draws on the same eight logo files, but it is deliberately **not** a consumer of this
 * module: those are stories with their own destinations, not the client list. See
 * `success-stories-carousel.tsx`.
 */
export const CLIENT_LOGOS = [
  { src: "/jollibee-logo.svg", alt: "Jollibee", width: 103, height: 24 },
  { src: "/kmc-logo.svg", alt: "KMC", width: 93, height: 22 },
  {
    src: "/ism-logo.svg",
    alt: "International School Manila",
    width: 162,
    height: 22,
  },
  { src: "/pitx-logo.svg", alt: "PITX", width: 72, height: 20 },
  { src: "/lucima-logo.svg", alt: "Lucima", width: 70, height: 37 },
  { src: "/rhk-logo.svg", alt: "RHK", width: 44, height: 40 },
  { src: "/anjo-world-logo.svg", alt: "Anjo World", width: 94, height: 29 },
  {
    src: "/enchanted-kingdom-logo.svg",
    alt: "Enchanted Kingdom",
    width: 69,
    height: 30,
  },
];

/**
 * The two contexts differ in three ways, and all three are reproduced here rather than normalised:
 * the gaps, the image class, and how each logo is centred in its cell.
 *
 * Normalising them would have been a visual change to one of the two pages, and this workspace has
 * no browser in which to judge it. Reconciling them is a design decision, not a refactor.
 *
 * - `hero` — the strip under the hero video placeholder. Each logo sits inside a centring wrapper,
 *   which is a flex box and therefore stretches to the cell its logo is centred inside.
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
}: {
  variant: ClientLogoGridVariant;
}) {
  const { grid, image, centreEachLogo } = VARIANTS[variant];

  return (
    <div className={grid}>
      {CLIENT_LOGOS.map((logo, index) => (
        <RevealImage
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
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
