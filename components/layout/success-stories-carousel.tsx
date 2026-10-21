import Image from "next/image";
import Link from "next/link";
import type { StoryCard } from "@/lib/content/types";

/**
 * Success stories.
 *
 * A dataset of its own, deliberately not shared with the client-logo list even though the same brand
 * names appear in both: these are stories with their own order and their own logo uploads, not the
 * client list. Both are edited at `/cms/home` (sections 4 and 8).
 *
 * **The card's image and its wash are a client-requested addition, not a reading of the frames.** No
 * frame defines a photograph here; the design shipped a black card with a logo on it. The wash is:
 *
 * - at rest, the photograph sits under a black overlay at 80%, so the card still reads almost black;
 * - on hover, that overlay is replaced by the brand gradient at 30%, so the photograph appears
 *   through a tinted wash.
 *
 * Both layers are stacked rather than one animated colour, because a single background cannot
 * interpolate from black to a three-stop gradient. They cross-fade, which also means the 30% value
 * stays exactly 30% instead of being composited over an already-dark card.
 *
 * The card's own hover gradient (50%, from an earlier round) was removed rather than layered: two
 * washes over the same photograph darken each other and the 30% stops meaning anything.
 *
 * **Deferred, at the client's request:** every card points at `href: "#"`, and the arrow in
 * "Read Story →" is part of the card's link rather than a control of its own. Giving each card a real
 * destination — and deciding whether the arrow is separately clickable — is a separate task.
 */
function StoryCardItem({
  card,
  duplicate = false,
}: {
  card: StoryCard;
  duplicate?: boolean;
}) {
  const className =
    "group relative flex h-[450px] w-[270px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border-y-2 border-[#27272a] bg-[#18181b] transition-colors duration-300 ease-out hover:border-slate-50";

  const content = (
    <>
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt=""
          fill
          sizes="270px"
          className="object-cover"
        />
      ) : null}

      {/* Rest: black at 80%, so the photograph is only suggested. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 transition-opacity duration-300 ease-out group-hover:opacity-0"
      />

      {/* Hover: the brand gradient at 30%. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#00c290]/30 via-[#0fb8aa]/30 to-[#1fadc5]/30 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
      />

      <div className="relative flex flex-1 items-center justify-center p-4">
        <Image
          src={card.logoUrl}
          // The second copy exists only to close the loop, so it is decorative: an empty alt keeps it
          // out of the accessibility tree and out of image results, while the visible copy keeps the
          // real name. Without this the same logo was announced twice on every pass.
          alt={duplicate ? "" : card.name}
          width={card.logoWidth}
          height={card.logoHeight}
          className="brightness-0 invert"
        />
      </div>
    </>
  );

  /*
    The loop needs two passes of the sequence to be seamless, and the second pass keeps every card in
    the visual flow while leaving the document tree. `ProductCarousel` treats its filler copies the
    same way, so this follows that rule rather than inventing a second one.
  */
  if (duplicate) {
    return (
      <div className={className} aria-hidden="true">
        {content}
      </div>
    );
  }

  return (
    <Link href="#" className={className}>
      {content}
    </Link>
  );
}

export function SuccessStoriesCarousel({ stories }: { stories: StoryCard[] }) {
  return (
    <div className="w-full overflow-hidden rounded-[30px]">
      <div className="flex w-max gap-6 animate-marquee-rtl hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {stories.map((card, index) => (
          <StoryCardItem key={`${card.name}-${index}`} card={card} />
        ))}
        {stories.map((card, index) => (
          <StoryCardItem key={`${card.name}-${index}-loop`} card={card} duplicate />
        ))}
      </div>
    </div>
  );
}
