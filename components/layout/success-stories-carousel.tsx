import Image from "next/image";
import Link from "next/link";

type StoryCard = {
  id: string;
  logo: { src: string; alt: string; width: number; height: number };
  href: string;
  highlight?: boolean;
};

const storyCards: StoryCard[] = [
  {
    id: "anjo-world",
    href: "#",
    logo: {
      src: "/anjo-world-logo.svg",
      alt: "Anjo World",
      width: 94,
      height: 29,
    },
  },
  {
    id: "enchanted-kingdom",
    href: "#",
    logo: {
      src: "/enchanted-kingdom-logo.svg",
      alt: "Enchanted Kingdom",
      width: 69,
      height: 30,
    },
  },
  {
    id: "ism",
    href: "#",
    logo: {
      src: "/ism-logo.svg",
      alt: "International School Manila",
      width: 162,
      height: 22,
    },
  },
  {
    id: "jollibee",
    href: "#",
    highlight: true,
    logo: {
      src: "/jollibee-logo.svg",
      alt: "Jollibee",
      width: 103,
      height: 24,
    },
  },
  {
    id: "kmc",
    href: "#",
    logo: { src: "/kmc-logo.svg", alt: "KMC", width: 93, height: 22 },
  },
  {
    id: "lucima",
    href: "#",
    logo: { src: "/lucima-logo.svg", alt: "Lucima", width: 70, height: 37 },
  },
  {
    id: "pitx",
    href: "#",
    logo: { src: "/pitx-logo.svg", alt: "PITX", width: 72, height: 20 },
  },
  {
    id: "rhk",
    href: "#",
    logo: { src: "/rhk-logo.svg", alt: "RHK", width: 44, height: 40 },
  },
];

function StoryCardItem({ card }: { card: StoryCard }) {
  return (
    <Link
      href={card.href}
      className={`group flex h-[450px] w-[270px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-[30px] border-y-2 transition-transform duration-300 ease-out hover:border-slate-50 border-[#27272a] bg-[#18181b] hover:bg-gradient-to-b from-[#00c290]/50 via-[49.519%] via-[#0fb8aa]/50 to-[#1fadc5]/50`}
    >
      <div className="flex flex-1 items-center justify-center p-4">
        <Image
          src={card.logo.src}
          alt={card.logo.alt}
          width={card.logo.width}
          height={card.logo.height}
          className={"brightness-0 invert"}
        />
      </div>
      <div className="flex h-[80px] w-full items-center justify-center py-4">
        <span
          className={`flex items-center gap-2 text-lg font-semibold transition-opacity group-hover:opacity-70 text-white`}
        >
          Read Story <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export function SuccessStoriesCarousel() {
  // duplicate the sequence for a seamless RTL loop, same pattern as the clients marquee
  const sequence = [...storyCards, ...storyCards];
  return (
    <div className="w-full overflow-hidden rounded-[30px]">
      <div className="flex w-max gap-6 animate-marquee-rtl hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {sequence.map((card, index) => (
          <StoryCardItem key={`${card.id}-${index}`} card={card} />
        ))}
      </div>
    </div>
  );
}
