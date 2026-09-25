import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroVideoSection } from "@/components/layout/hero-video-section";
import { ParallaxFeaturesSection } from "@/components/layout/parallax-features-section";
import { PandoraShowcaseGrid } from "@/components/layout/pandora-showcase-grid";
import { ClientLogoMarquee } from "@/components/layout/client-logo-marquee";
import { Button } from "@/components/ui/Button";
import { SuccessStoriesCarousel } from "@/components/layout/success-stories-carousel";
import { ContactSection } from "@/components/marketing/contact-section";
import { HeroReveal, Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

/**
 * The business-features grid.
 *
 * Twelve cells: a category title, the headline that sells it, and a sentence of detail. The Figma
 * frame carries nine, so the extra three are a deliberate content deviation (Round 24) — the client's
 * list is the source of truth. Twelve happens to divide by 1, 2 and 3, so the grid still fills whole
 * rows at every breakpoint.
 *
 * Kept in page order rather than sorted: the first cells are the ones a visitor reads, and the card
 * stagger follows this order.
 */
const businessFeatures = [
  {
    title: "Hospitals & Healthcare",
    headline: "Secure Storage for Staff and Healthcare Environments.",
    text: "Give medical staff convenient, keyless access to personal storage while helping keep shared spaces organized and focused on care.",
  },
  {
    title: "Factories & Manufacturing",
    headline: "Streamline Shift Changes and Employee Storage.",
    text: "Simplify employee storage and handoffs while helping keep shift changes organized and operations moving.",
  },
  {
    title: "Terminals",
    headline: "Secure Storage for Passengers Between Connections.",
    text: "Give travelers a convenient place to store luggage while they wait, dine, shop, or move between connections.",
  },
  {
    title: "Offices & Corporate",
    headline: "Free Up Space. Simplify Workplace Storage.",
    text: "Manage employee belongings and selected workplace assets through connected storage designed for the needs of modern offices.",
  },
  {
    title: "Theme Parks",
    headline: "Improve Guest Mobility and Experience.",
    text: "Give guests secure storage for bags and belongings so they can move through your destination more freely and enjoy more of the experience.",
  },
  {
    title: "Schools & Universities",
    headline: "Bring Campus Storage Into the Digital Age.",
    text: "Give students and staff convenient, connected access to storage for books, devices, and personal belongings.",
  },
  {
    title: "Events & Convention Centers",
    headline: "Clear the Floor. Improve the Attendee Experience.",
    text: "Provide convenient storage for coats, bags, and belongings so attendees can network, explore, and participate without carrying everything with them.",
  },
  {
    title: "Recreational Areas",
    headline: "Secure Storage for Active Destinations.",
    text: "Give runners, visitors, athletes, and active guests a convenient place to store belongings while they enjoy the destination.",
  },
  {
    title: "Restaurants",
    headline: "Reduce Counter Congestion. Improve the Handoff.",
    text: "Support secure customer storage and streamline delivery handoffs so front-of-house teams can stay focused on service.",
  },
  {
    title: "Residential",
    headline: "A Smarter Extension of Your Property's Concierge.",
    text: "Give residents 24/7 access to convenient parcel and personal storage while reducing manual handling for property teams.",
  },
  {
    title: "Resorts",
    headline: "Simplify Luggage Storage. Improve the Guest Experience.",
    text: "Give guests convenient storage for luggage, valuables, and belongings before check-in, after check-out, or throughout their stay.",
  },
  {
    title: "Lifestyle Parks",
    headline: "Enjoy More, Carry Less.",
    text: "Walk, jog, shop, and enjoy more when you carry less of your things.",
  },
];

export default function Home() {
  const siteUrl = getSiteUrl();

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--heading)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${siteUrl}/#organization`,
              name: "QUBE",
              url: siteUrl,
              logo: absoluteUrl("/qube-logo.svg"),
              description: SITE_DESCRIPTION,
            },
            {
              "@type": "WebSite",
              "@id": `${siteUrl}/#website`,
              name: SITE_NAME,
              url: siteUrl,
              publisher: { "@id": `${siteUrl}/#organization` },
              inLanguage: "en",
            },
          ],
        }}
      />

      <SiteNav />

      <section className="mx-auto grid min-h-[356px] w-full max-w-[1040px] gap-8 px-6 py-16 lg:grid-cols-2 lg:px-0 lg:py-[120px]">
        <div className="max-w-[508px]">
          {/* Above the fold. The heading is the largest contentful paint element, so it takes the
              shortest and only undelayed fade in the hero cascade — see
              components/motion/variants.ts. */}
          <HeroReveal
            as="h1"
            index={0}
            variant="heading"
            className="max-w-[508px] text-4xl font-bold leading-[1.05] tracking-tight lg:text-[40px] lg:leading-[1.12] lg:tracking-normal"
          >
            QUBE Smart Lockers - first step towards smarter cities
          </HeroReveal>
          <HeroReveal as="div" index={1}>
            <Link
              href="#contact"
              className="cta-gradient motion-press mt-8 inline-flex h-11 items-center rounded-[var(--radius-control)] px-6 text-sm font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Talk to an Expert
            </Link>
          </HeroReveal>
        </div>
        <HeroReveal
          as="div"
          index={2}
          className="flex items-end justify-start gap-2 pb-1 text-sm lg:justify-end"
        >
          <span className="font-bold text-[var(--brand-ink)]">PANDORA 3.0</span>
          <Link
            href="/products"
            className="text-[var(--text-muted)] hover:underline"
          >
            All solutions that we provide
          </Link>
          <span aria-hidden="true">&rarr;</span>
        </HeroReveal>
      </section>

      <HeroReveal
        as="section"
        index={3}
        variant="visual"
        className="mx-auto max-w-[1040px] px-6 pb-16 lg:px-0 lg:pb-[100px]"
      >
        <HeroVideoSection />
      </HeroReveal>

      <section
        id="features"
        className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28"
      >
        <Reveal
          variant="fade"
          as="h2"
          index={0}
          className="text-2xl font-semibold"
        >
          Built for every businesses
        </Reveal>
        {/*
          The grid lines are the panel's own background showing through 1px gaps, not borders on the
          cells. The Figma frame draws them that way — nine tiles 346.667px wide sitting adjacent in a
          1040px panel, their 1px strokes coincident on the shared edges — and cell borders cannot
          reproduce it: a right border on every cell doubles the frame's own right edge and a bottom
          border doubles its bottom edge, and both are then clipped short by the panel's rounded
          corners. Gaps produce one line per division, at every breakpoint, and never touch a corner.
          The radius is the design's 30px (measured 29.5), not the 16px card token this used to use.
        */}
        <div className="mt-8 w-full overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-white">
          <div className="grid auto-rows-fr grid-cols-1 gap-px bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-3">
            {businessFeatures.map(({ title, headline, text }, index) => (
              /* Fade only. A gap is the line here, so translating a cell would slide it off the
                 grid's background and open a 20px band of border colour behind it. */
              <Reveal
                as="article"
                key={title}
                index={index}
                variant="fade"
                className="flex h-full w-full flex-col items-start justify-start bg-[var(--background)] p-5"
              >
                <div className="flex gap-2 h-fit w-fit items-center justify-center">
                  <div
                    className="rounded-full bg-gradient-to-b from-[#00c290] via-[49.519%] via-[#0fb8aa] to-[#1fadc5]"
                    style={{
                      width: "5px",
                      height: "14px",
                    }}
                  ></div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)]">
                    {title}
                  </h3>
                </div>
                <p className="mt-1 text-md font-bold">{headline}</p>
                <p className="mt-3 text-sm leading-5 text-[var(--text-muted)]">
                  {text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <ParallaxFeaturesSection />
      </section>

      <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <Reveal
          as="h2"
          index={0}
          className="max-w-md text-3xl font-semibold leading-tight"
        >
          PANDORA - our most advanced Smart Locker yet
        </Reveal>
        <Reveal as="div" index={1} variant="move" className="mt-8">
          <PandoraShowcaseGrid />
        </Reveal>
      </section>

      <Reveal
        as="section"
        className="mx-auto max-w-[1040px] px-6 py-20 text-center lg:px-0 lg:py-28"
      >
        <h2 className="text-2xl font-semibold">
          Ask how we can help your business
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">
          Send us your contact information and a QUBE Smart Solution Expert will
          reach out to you shortly.
        </p>
        <Link
          href="#contact"
          className="cta-gradient motion-press mt-6 inline-flex rounded-[var(--radius-control)] px-6 py-3 text-sm font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Talk to an Expert
        </Link>
      </Reveal>

      <Reveal
        as="section"
        className="mx-auto w-full max-w-[1040px] px-6 pt-24 pb-20 lg:px-0 lg:py-28"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-[var(--heading)]">
            Our Clients
          </h2>
          <Button variant="dark">Learn More</Button>
        </div>
        <div className="mt-6">
          <ClientLogoMarquee />
        </div>
      </Reveal>

      <Reveal as="section" className="py-24 lg:py-28">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 lg:px-0">
          <h2 className="text-3xl font-semibold text-[var(--heading)]">
            Success stories
          </h2>
          <Button variant="dark">Read stories</Button>
        </div>
        <div className="mx-auto mt-6 max-w-[1440px] px-6 lg:px-0">
          <SuccessStoriesCarousel />
        </div>
      </Reveal>

      <ContactSection sourcePath="/" />

      <SiteFooter />
    </main>
  );
}
