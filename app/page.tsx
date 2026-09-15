import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { HeroVideoSection } from "@/components/layout/hero-video-section";
import { ParallaxFeaturesSection } from "@/components/layout/parallax-features-section";
import { PandoraShowcaseGrid } from "@/components/layout/pandora-showcase-grid";
import { ClientLogoMarquee } from "@/components/layout/client-logo-marquee";
import { Button } from "@/components/ui/Button";
import { SuccessStoriesCarousel } from "@/components/layout/success-stories-carousel";

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

const storyNames = [
  "International School Manila",
  "Jollibee",
  "KMC",
  "Lucima",
  "PITX",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f1f5f9] text-[#18181b]">
      <SiteNav />
      <section className="mx-auto grid min-h-[356px] w-full max-w-[1040px] gap-8 px-6 py-16 lg:grid-cols-2 lg:px-0 lg:py-[120px]">
        <div className="max-w-[508px]">
          <h1 className="max-w-[508px] text-4xl font-bold leading-[1.12] lg:text-[40px]">
            QUBE Smart Lockers - first step towards smarter cities
          </h1>
          <Link
            href="#contact"
            className="mt-8 inline-flex h-11 items-center rounded-xl bg-[#10b9b8] px-6 text-sm font-bold text-white"
          >
            Talk to an Expert
          </Link>
        </div>
        <div className="flex items-end justify-end gap-2 pb-1 text-sm">
          <span className="font-bold text-[#0e8e8f]">PANDORA 3.0</span>
          <span className="text-[#71717a]">All solutions that we provide</span>
          <span aria-hidden="true">→</span>
        </div>
      </section>
      <section className="mx-auto max-w-[1040px] px-6 pb-16 lg:px-0 lg:pb-[100px]">
        <HeroVideoSection />
      </section>
      <section
        id="features"
        className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28"
      >
        <h2 className="text-2xl font-semibold">Built for every businesses</h2>
        <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-[#dbe3ec] sm:grid-cols-2 lg:grid-cols-3">
          {businessFeatures.map(([title, body]) => (
            <article
              key={title}
              className="min-h-[150px] border-b border-[#dbe3ec] p-5 lg:border-r"
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-3 text-sm leading-5 text-[#52525b]">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <ParallaxFeaturesSection />
      </section>
      <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <h2 className="max-w-md text-3xl font-semibold leading-tight">
          PANDORA - our most advanced Smart Locker yet
        </h2>
        <div className="mt-8">
          <PandoraShowcaseGrid />
        </div>
      </section>
      <section className="mx-auto max-w-[1040px] px-6 py-20 text-center lg:px-0 lg:py-28">
        <h2 className="text-2xl font-semibold">
          Ask how we can help your business
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#71717a]">
          Send us your contact information and a QUBE Smart Solution Expert will
          reach out to you shortly.
        </p>
        <Link
          href="#contact"
          className="mt-6 inline-flex rounded-xl bg-[#10b9b8] px-6 py-3 text-sm font-bold text-white"
        >
          Talk to an Expert
        </Link>
      </section>
      <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-gray-900">Our Clients</h2>
          <Button variant="dark">Learn More</Button>
        </div>
        <div className="mt-6">
          <ClientLogoMarquee />
        </div>
      </section>
      <section className="py-24 lg:py-28">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 lg:px-0">
          <h2 className="text-3xl font-semibold text-gray-900">
            Success stories
          </h2>
          <Button variant="dark">Read stories</Button>
        </div>
        <div className="mx-auto mt-6 max-w-[1440px] px-6 lg:px-0">
          <SuccessStoriesCarousel />
        </div>
      </section>
      <section
        id="contact"
        className="mx-auto grid w-full max-w-[1040px] gap-8 px-6 py-20 lg:grid-cols-[1fr_1fr] lg:px-0 lg:py-28"
      >
        <form className="rounded-2xl border border-[#dbe3ec] p-6">
          <h2 className="text-lg font-semibold">
            Talk to a QUBE Smart Solution Expert
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              className="landing-input"
              placeholder="Your name"
              aria-label="Your name"
            />
            <input
              className="landing-input"
              placeholder="Work email"
              aria-label="Work email"
            />
            <input
              className="landing-input"
              placeholder="Company name"
              aria-label="Company name"
            />
            <input
              className="landing-input"
              placeholder="Your location"
              aria-label="Your location"
            />
            <textarea
              className="landing-input min-h-24 sm:col-span-2"
              placeholder="Tell us about your business pain-points and goals"
              aria-label="Business needs"
            />
          </div>
          <button
            type="submit"
            className="mt-5 rounded-xl bg-[#10b9b8] px-5 py-2 text-xs font-bold text-white"
          >
            Talk to an Expert
          </button>
        </form>
        <div className="grid grid-cols-2 rounded-2xl border border-[#dbe3ec]">
          <article className="border-b border-r border-[#dbe3ec] p-5">
            <h3 className="text-sm font-semibold">Real-time data tracking</h3>
            <p className="mt-2 text-xs text-[#71717a]">
              Real-time analytics are reflected once they are available.
            </p>
          </article>
          <article className="border-b border-[#dbe3ec] p-5">
            <h3 className="text-sm font-semibold">Online configuration</h3>
            <p className="mt-2 text-xs text-[#71717a]">
              Services, pricing, values, and user flows.
            </p>
          </article>
          <article className="border-r border-[#dbe3ec] p-5">
            <h3 className="text-sm font-semibold">App connection</h3>
            <p className="mt-2 text-xs text-[#71717a]">
              QUBE App can now be downloaded on iOS.
            </p>
          </article>
          <article className="p-5">
            <h3 className="text-sm font-semibold">Customizability</h3>
            <p className="mt-2 text-xs text-[#71717a]">
              Hardware and software 100% customizable.
            </p>
          </article>
        </div>
      </section>
      <footer className="border-t border-[#cbd5e1] py-12">
        <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-6 lg:grid-cols-[1fr_2fr] lg:px-0">
          <div>
            <Image src="/qube-logo.svg" alt="QUBE" width={99} height={32} />
            <p className="mt-4 max-w-xs text-xs leading-5 text-[#71717a]">
              A precise structural object representing the infrastructure for an
              enterprise-ready locker system.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-xs">
            <div>
              <h3 className="font-semibold">SECTION 1</h3>
              <p className="mt-3 text-[#71717a]">
                Link 1<br />
                Link 2<br />
                Link 3<br />
                Link 4
              </p>
            </div>
            <div>
              <h3 className="font-semibold">SECTION 2</h3>
              <p className="mt-3 text-[#71717a]">
                Link 1<br />
                Link 2<br />
                Link 3<br />
                Link 4
              </p>
            </div>
            <div>
              <h3 className="font-semibold">SECTION 3</h3>
              <p className="mt-3 text-[#71717a]">
                Link 1<br />
                Link 2<br />
                Link 3<br />
                Link 4
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
