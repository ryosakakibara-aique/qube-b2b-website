import Image from "next/image";

type ClientLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const clientLogos: ClientLogo[] = [
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

export function HeroVideoSection() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#e5e7eb] bg-black/15 sm:h-[420px] lg:h-[600px]">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#212121]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 3.5v11l10-5.5z" fill="#ffffff" />
            </svg>
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#424242]">
            Product Demo / Hero Video Placeholder
          </p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-70% to-[#f1f5f9]/0 py-4">
        <div className="grid grid-cols-2 items-center gap-x-10 gap-y-6 sm:grid-cols-4">
          {clientLogos.map((logo) => (
            <div key={logo.alt} className="flex items-center justify-center">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-auto w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
