import Image from "next/image";
import { RevealLink } from "@/components/motion/reveal-link";

/**
 * The nine-tile PANDORA showcase.
 *
 * Each tile carries one of the exported images from `public/pandora-features-images`.
 *
 * **The pairing is by shape, not by name.** The files are `pandora-1` … `pandora-9` with no content in
 * their metadata beyond `Software: Figma`, so nothing in the repository says which photograph belongs
 * to which tile. What is knowable is the geometry, and it lines up: two assets are twice as wide as
 * they are tall, one is taller than it is wide, and six are single-tile shaped — which is exactly the
 * grid's composition (`lg:col-span-2` twice, `lg:row-span-2` once, six singles). Those three go to
 * those three, and the remaining six fill the single tiles in filename order. If a pairing is wrong it
 * is one string per tile to change.
 *
 * The images are marked decorative (`alt=""`) rather than described, because the label beside each one
 * already names the feature and the alternative would be alt text invented for pictures nobody here
 * has seen.
 *
 * Aspect ratios, measured rather than assumed: the two wide assets are 2.15:1 against a tile that is
 * 2.56:1, the tall one is 1:1.67 against 1:1.56, and the six singles run 1.10–1.62:1 against a tile of
 * about 1.28:1. `object-cover` therefore trims up to 21% from the widest of them (`pandora-7`) and
 * under 7% from most.
 */

type ShowcaseCellData = {
  id: string; // renamed from `key` — `key` is a reserved React prop name
  label: string;
  /** Path under `public/pandora-features-images`, paired to the tile's shape. */
  image: string;
  variant: "dark" | "light";
  gridClassName: string;
};

const IMAGE_DIR = "/pandora-features-images";

const cells: ShowcaseCellData[] = [
  {
    id: "terminals-1",
    label: "For Terminals",
    image: `${IMAGE_DIR}/pandora-1.png`,
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-1",
  },
  {
    id: "laundry",
    label: "For Laundry businesses",
    image: `${IMAGE_DIR}/pandora-6.png`,
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
  },
  {
    id: "qube-app",
    label: "QUBE App",
    image: `${IMAGE_DIR}/pandora-5.png`,
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-2 lg:row-span-2",
  },
  {
    id: "qr-cash",
    label: "QR & Cash Payments",
    image: `${IMAGE_DIR}/pandora-2.png`,
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-2",
  },
  {
    id: "data-config",
    label: "Data and Configuration",
    image: `${IMAGE_DIR}/pandora-3.png`,
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-2",
  },
  {
    id: "terminals-2",
    label: "For Terminals",
    image: `${IMAGE_DIR}/pandora-4.png`,
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-3",
  },
  {
    id: "real-time",
    label: "Real-time data",
    image: `${IMAGE_DIR}/pandora-7.png`,
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-3",
  },
  {
    id: "recreational",
    label: "For Recreational areas",
    image: `${IMAGE_DIR}/pandora-9.png`,
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:col-span-2 lg:row-start-4",
  },
  {
    id: "offices",
    label: "For Offices",
    image: `${IMAGE_DIR}/pandora-8.png`,
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-4",
  },
];

// ShowcaseCell's prop type only needs the rendering fields, plus its place in the stagger.
function ShowcaseCell({
  label,
  image,
  variant,
  gridClassName,
  index,
}: Omit<ShowcaseCellData, "id"> & { index: number }) {
  const isDark = variant === "dark";
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
      } lg:h-full lg:min-h-0 ${gridClassName}`}
    >
      {/* Base surface: the photo covers it, and it is what remains if the image cannot load. */}
      <div
        className={`absolute inset-0 ${isDark ? "bg-[#27272a]" : "bg-[#f1f5f9]"}`}
        aria-hidden="true"
      />

      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover"
      />

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
        {label}
        {/* <ArrowIcon /> */}
      </span>
    </RevealLink>
  );
}

export function PandoraShowcaseGrid() {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[30px] border border-[#e5e7eb] lg:h-[1082px] lg:grid-cols-3 lg:grid-rows-4">
      {cells.map(({ id, ...cellProps }, index) => (
        <ShowcaseCell key={id} index={index} {...cellProps} />
      ))}
    </div>
  );
}
