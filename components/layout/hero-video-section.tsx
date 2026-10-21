import { ClientLogoGrid } from "@/components/layout/client-logo-grid";
import { HeroVideoEmbed } from "@/components/layout/hero-video-embed";
import { ScrollReveal } from "@/components/motion/reveal";
import { parseYouTubeId } from "@/lib/content/video";
import type { ClientLogo } from "@/lib/content/types";

/**
 * The hero demo video, plus the client-logo strip beneath it.
 *
 * The link and its accessible name are homepage content now (`/cms/home`, section 3), so replacing
 * the video is an editorial change rather than a deploy. An empty link — or one that is not a single
 * YouTube video — renders the poster state instead, with no other change; that is the mechanism the
 * old `PLACEHOLDER_ID` constant used to provide.
 *
 * The title matters beyond the CMS form: an iframe has no `alt`, so its `title` is the only name a
 * screen reader has for it, and it is what validation requires whenever a link is set.
 *
 * Three things come with any YouTube embed and none of them are fixable here: its branding cannot be
 * removed (`modestbranding` and `showinfo` are deprecated), the pause control is a design addition
 * the frames do not define — required by WCAG 2.2.2 for an autoplaying loop — and a YouTube iframe
 * letterboxes rather than filling the hero box, which a vertical clip makes obvious.
 */
export function HeroVideoSection({
  videoUrl,
  videoTitle,
  logos,
}: {
  videoUrl: string;
  videoTitle: string;
  logos: ClientLogo[];
}) {
  const videoId = parseYouTubeId(videoUrl);

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
        {videoId ? (
          <HeroVideoEmbed
            videoId={videoId}
            title={videoTitle || "QUBE product demo"}
          />
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
              Product demo
            </p>
          </div>
        )}
      </ScrollReveal>
      <div className="flex w-full items-center justify-center bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-70% to-[#f1f5f9]/0 py-4">
        <ClientLogoGrid variant="hero" logos={logos} />
      </div>
    </div>
  );
}
