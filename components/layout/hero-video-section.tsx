import { ClientLogoGrid } from "@/components/layout/client-logo-grid";

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
        <ClientLogoGrid variant="hero" />
      </div>
    </div>
  );
}
