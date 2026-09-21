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

const businessFeatures = [
  [
    "Terminals",
    "Give travelers a secure spot to store luggage while they move freely between gates and transit.",
  ],
  [
    "Offices",
    "Free up desk space and keep employee belongings safe with smart locker systems throughout the workplace.",
  ],
  [
    "Theme Parks",
    "Let guests stash bags and prizes securely so they can enjoy rides and attractions hands-free.",
  ],
  [
    "Hotels",
    "Offer attendees convenient storage for coats, bags, and gear so they feel welcome in the experience.",
  ],
  [
    "Events",
    "Flexible storage for conference attendees and guests, giving guests a better experience in the venue.",
  ],
  [
    "Recreational Areas",
    "Keep personal items safe while visitors enjoy outdoor activities like sports, hiking, and swimming.",
  ],
  [
    "Restaurants",
    "Allow diners to securely store shopping bags and outerwear for a more comfortable dining experience.",
  ],
  [
    "Residentials",
    "Give residents 24/7 parcel collection and personal storage right in their building lobby.",
  ],
  [
    "Resorts",
    "Enhance the guest experience with secure storage for luggage, valuables, and beach essentials.",
  ],
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
        <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-3">
          {businessFeatures.map(([title, body], index) => (
            /* Fade only. These cells share their 1px rules with their neighbours, so rising one
               would visibly pull the grid lines apart mid-animation. */
            <Reveal
              as="article"
              key={title}
              index={index}
              variant="fade"
              className="min-h-[150px] border-b border-[var(--border-subtle)] p-5 lg:border-r"
            >
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-5 text-[var(--text-muted)]">
                {body}
              </p>
            </Reveal>
          ))}
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
        <Reveal as="div" index={1} className="mt-8">
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
