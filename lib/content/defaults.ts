import type { HomepageContent } from "@/lib/content/types";

/**
 * The homepage copy as it stood when it moved into the CMS.
 *
 * This is **not** sample content: it is the source the page renders until a CMS user saves the record
 * for the first time, and it is what `/` falls back to if the content read fails. That is a
 * deliberate choice for the one page whose absence would visibly break the site — a Supabase outage
 * must not turn the storefront into an empty shell — and it is why `supabase/migrations/005` seeds no
 * row: the first save is what persists this text, so no migration can silently change what the page
 * says.
 *
 * The cost of that choice is drift: an edit made here does nothing to a record that has already been
 * saved. Treat this file as a snapshot, not a second source of truth — change the copy in
 * `/cms/home`.
 */
export const HOMEPAGE_DEFAULTS: HomepageContent = {
  heroHeading: "QUBE Smart Lockers - first step towards smarter cities",
  heroSubLabel: "QUBE Product Suite",
  heroLinkLabel: "Explore Our Products",
  heroLinkHref: "/products",
  ctaLabel: "Talk to an Expert",
  ctaHref: "#contact",
  // A stand-in, not QUBE's own video. Replacing it is now a CMS edit rather than a deploy.
  videoUrl: "https://www.youtube.com/watch?v=EELwau9_mTA",
  videoTitle: "Google AI Plans - Gemini Omni Version 2 9x16",
  featuresHeading: "Built for every businesses",
  showcaseHeading: "PANDORA - our most advanced Smart Locker yet",
  clientsHeading: "Our Clients",
  businessFeatures: [
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
      title: "Malls",
      headline: "Make Shopping More Convenient.",
      text: "Give shoppers secure storage for bags and personal belongings so they can shop freely without carrying everything.",
    },
  ],
  // Paired by shape to `SHOWCASE_SLOTS`, which owns the geometry. Order is the slot order.
  showcaseTiles: [
    { label: "For Terminals", imageUrl: "/pandora-features-images/pandora-1.png" },
    { label: "For Laundry businesses", imageUrl: "/pandora-features-images/pandora-6.png" },
    { label: "QUBE App", imageUrl: "/pandora-features-images/pandora-5.png" },
    { label: "QR & Cash Payments", imageUrl: "/pandora-features-images/pandora-2.png" },
    { label: "Data and Configuration", imageUrl: "/pandora-features-images/pandora-3.png" },
    { label: "For Terminals", imageUrl: "/pandora-features-images/pandora-4.png" },
    { label: "Real-time data", imageUrl: "/pandora-features-images/pandora-7.png" },
    { label: "For Recreational areas", imageUrl: "/pandora-features-images/pandora-9.png" },
    { label: "For Offices", imageUrl: "/pandora-features-images/pandora-8.png" },
  ],
  // One list, drawn twice: the hero strip and the "Our Clients" marquee render the same logos.
  logos: [
    { name: "Jollibee", imageUrl: "/jollibee-logo.svg", width: 103, height: 24 },
    { name: "KMC", imageUrl: "/kmc-logo.svg", width: 93, height: 22 },
    {
      name: "International School Manila",
      imageUrl: "/ism-logo.svg",
      width: 162,
      height: 22,
    },
    { name: "PITX", imageUrl: "/pitx-logo.svg", width: 72, height: 20 },
    { name: "Lucima", imageUrl: "/lucima-logo.svg", width: 70, height: 37 },
    { name: "RHK", imageUrl: "/rhk-logo.svg", width: 44, height: 40 },
    { name: "Anjo World", imageUrl: "/anjo-world-logo.svg", width: 94, height: 29 },
    { name: "Enchanted Kingdom", imageUrl: "/enchanted-kingdom-logo.svg", width: 69, height: 30 },
  ],
  /*
    Stories are their own dataset, separate from `logos` even though the same eight names appear in
    both: these are stories with their own order, not the client list.

    No story has a photograph yet — the design shipped a black card — so `imageUrl` is empty and the
    card renders exactly as it does today until one is uploaded in the CMS.
  */
  stories: [
    { name: "Anjo World", logoUrl: "/anjo-world-logo.svg", logoWidth: 94, logoHeight: 29, imageUrl: "" },
    { name: "Enchanted Kingdom", logoUrl: "/enchanted-kingdom-logo.svg", logoWidth: 69, logoHeight: 30, imageUrl: "" },
    { name: "International School Manila", logoUrl: "/ism-logo.svg", logoWidth: 162, logoHeight: 22, imageUrl: "" },
    { name: "Jollibee", logoUrl: "/jollibee-logo.svg", logoWidth: 103, logoHeight: 24, imageUrl: "" },
    { name: "KMC", logoUrl: "/kmc-logo.svg", logoWidth: 93, logoHeight: 22, imageUrl: "" },
    { name: "Lucima", logoUrl: "/lucima-logo.svg", logoWidth: 70, logoHeight: 37, imageUrl: "" },
    { name: "PITX", logoUrl: "/pitx-logo.svg", logoWidth: 72, logoHeight: 20, imageUrl: "" },
    { name: "RHK", logoUrl: "/rhk-logo.svg", logoWidth: 44, logoHeight: 40, imageUrl: "" },
  ],
};
