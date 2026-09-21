import { ClientLogoGrid } from "@/components/layout/client-logo-grid";

const topRowWidths = [600, 600, 600];
const bottomRowWidths = [600, 600, 600, 600];

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
        <ClientLogoGrid variant="marquee" />
      </div>
    </div>
  );
}
