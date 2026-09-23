import { ClientLogoGrid } from "@/components/layout/client-logo-grid";
import { HeroVideoEmbed } from "@/components/layout/hero-video-embed";
import { ScrollReveal } from "@/components/motion/reveal";

/**
 * The hero demo video.
 *
 * ⚠️ **This is a stand-in, not QUBE's video.** `EELwau9_mTA` is *"Google AI Plans - Gemini Omni
 * Version 2 9x16"* from Google's own channel: 30 seconds, and framed vertically. It is here so the
 * embed can be seen working, and it has to be replaced before the hero is presented as finished — the
 * content, the branding and the framing are all somebody else's. Replace both constants together,
 * because the title is what assistive technology announces for the frame.
 *
 * A real replacement has to be your own upload with embedding enabled.
 */
/**
 * Typed as a plain string deliberately. With a literal type TypeScript can prove the sentinel below
 * can never match, and rejects the check as an unintentional comparison — which would make the
 * poster fallback unreachable at the type level even though it is exactly what it is for.
 */
const HERO_VIDEO_ID: string = "EELwau9_mTA";

/** Announced to assistive technology in place of the embed, which is otherwise an unlabelled frame. */
const HERO_VIDEO_TITLE = "Google AI Plans - Gemini Omni Version 2 9x16";

/** Restoring this renders the poster state instead of an embed, with no other change. */
const PLACEHOLDER_ID = "REPLACE_WITH_YOUTUBE_VIDEO_ID";

export function HeroVideoSection() {
  const hasVideo = HERO_VIDEO_ID !== PLACEHOLDER_ID;

  return (
    <div className="flex w-full flex-col items-center">
      {/*
        The box reveals on the visitor's first scroll rather than on load. It sits inside the first
        screen, so a viewport-triggered reveal would fire at hydration and be a mount animation with
        extra steps; `ScrollReveal` waits for the scroll latch as well. It is the same element as
        before — same tag and classes — so nothing about the layout moves.
      */}
      <ScrollReveal
        as="div"
        className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#e5e7eb] bg-black/15 sm:h-[420px] lg:h-[600px]"
      >
        {hasVideo ? (
          <HeroVideoEmbed videoId={HERO_VIDEO_ID} title={HERO_VIDEO_TITLE} />
        ) : (
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
        )}
      </ScrollReveal>
      <div className="flex w-full items-center justify-center bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-70% to-[#f1f5f9]/0 py-4">
        <ClientLogoGrid variant="hero" />
      </div>
    </div>
  );
}
