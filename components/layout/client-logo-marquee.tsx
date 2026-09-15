import Image from "next/image";

const topRowWidths = [600, 600, 600];
const bottomRowWidths = [600, 600, 600, 600];

const clientLogos = [
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

function MarqueeRow({
  widths,
  direction,
}: {
  widths: number[];
  direction: "ltr" | "rtl";
}) {
  // duplicate the sequence so the loop is seamless at the 50% mark
  const sequence = [...widths, ...widths];
  return (
    <div className="w-full overflow-hidden rounded-[30px]">
      <div
        className={`flex w-max gap-3 ${
          direction === "ltr" ? "animate-marquee-ltr" : "animate-marquee-rtl"
        }`}
      >
        {sequence.map((width, index) => (
          <div
            key={`${direction}-${index}`}
            className="h-[300px] shrink-0 rounded-[30px] bg-[#e5e7eb]"
            style={{ width: `${width}px` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export function ClientLogoMarquee() {
  return (
    <div className="relative flex w-full flex-col gap-3 rounded-[32px]">
      <MarqueeRow widths={topRowWidths} direction="ltr" />
      <MarqueeRow widths={bottomRowWidths} direction="rtl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[200px] items-center justify-center bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-[70.192%] to-transparent px-6 py-4">
        <div className="grid grid-cols-2 items-center gap-x-8 gap-y-4 sm:grid-cols-4">
          {clientLogos.map((logo) => (
            <Image
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="h-auto max-h-8 w-auto opacity-90"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
