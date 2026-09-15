import type { Product } from "@/lib/products/types";

export const mockProducts: Product[] = [
  {
    id: "mock-pandora-3",
    title: "PANDORA 3.0",
    slug: "pandora",
    description:
      "Our most advanced smart locker for terminals, offices, and connected businesses.",
    tags: ["smart locker", "enterprise", "PANDORA"],
    imageUrl: "/section-pandora.png",
    imageAlt: "PANDORA smart locker in use across business environments",
    acquisition: "Talk to a QUBE Smart Solution Expert",
    locations: "Multiple locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Empower your workspace",
        body: "A professional, flexible storage solution for the places where people work, travel, and connect.",
      },
      {
        heading: "Real-time data",
        body: "Monitor locker activity and make more informed operational decisions with connected product data.",
      },
      {
        heading: "Built for every business",
        body: "From terminals to recreational areas, configure the experience around the people you serve.",
      },
    ],
  },
  {
    id: "mock-university-locker",
    title: "University Locker",
    slug: "university-locker",
    description:
      "Secure, convenient storage that supports students, staff, and campus operations.",
    tags: ["education", "campus", "storage"],
    imageUrl: "/hero-demo.png",
    imageAlt: "University smart locker interface",
    acquisition: "Request a campus consultation",
    locations: "Campus locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Made for campus life",
        body: "Give students and staff a secure place for belongings between classes, activities, and events.",
      },
      {
        heading: "Simple administration",
        body: "Keep the experience clear for users while giving campus teams a dependable locker system.",
      },
    ],
  },
  {
    id: "mock-concert-locker",
    title: "Concert Locker",
    slug: "concert-locker",
    description:
      "Fast, accessible storage that helps venues create a smoother guest experience.",
    tags: ["events", "venues", "guest experience"],
    imageUrl: "/hero-demo.png",
    imageAlt: "Concert venue smart locker interface",
    acquisition: "Plan your venue solution",
    locations: "Venue locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Keep guests moving",
        body: "Reduce friction at busy venues with convenient storage that fits the flow of an event.",
      },
      {
        heading: "Designed for events",
        body: "Support a better guest experience from arrival through the final encore.",
      },
    ],
  },
  {
    id: "mock-rfid-locker",
    title: "RFID Locker",
    slug: "rfid-locker",
    description:
      "Connected locker access and tracking for organizations that need dependable control.",
    tags: ["RFID", "access", "operations"],
    imageUrl: "/hero-demo.png",
    imageAlt: "RFID-enabled smart locker interface",
    acquisition: "Discuss RFID integration",
    locations: "Configured locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Connected access",
        body: "Create a more accountable storage experience with modern access technology.",
      },
      {
        heading: "Flexible configuration",
        body: "Shape the system around your environment, users, and operating requirements.",
      },
    ],
  },
  {
    id: "mock-parcel-locker",
    title: "Parcel Locker",
    slug: "parcel-locker",
    description:
      "Reliable last-mile storage that gives people a simple way to receive and collect parcels.",
    tags: ["parcels", "residential", "delivery"],
    imageUrl: "/hero-demo.png",
    imageAlt: "Parcel locker interface",
    acquisition: "Plan a parcel solution",
    locations: "Residential locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Simpler parcel collection",
        body: "Make delivery collection more convenient for residents, staff, and operators.",
      },
    ],
  },
  {
    id: "mock-office-locker",
    title: "Office Locker",
    slug: "office-locker",
    description:
      "Flexible personal storage that helps teams make better use of shared workplaces.",
    tags: ["office", "workplace", "storage"],
    imageUrl: "/hero-demo.png",
    imageAlt: "Office locker interface",
    acquisition: "Configure an office solution",
    locations: "Office locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "A better workplace experience",
        body: "Give teams secure, accessible storage that supports flexible ways of working.",
      },
    ],
  },
  {
    id: "mock-laundry-locker",
    title: "Laundry Locker",
    slug: "laundry-locker",
    description:
      "Convenient collection and drop-off storage for modern laundry businesses and their customers.",
    tags: ["laundry", "collection", "service"],
    imageUrl: "/hero-demo.png",
    imageAlt: "Laundry locker interface",
    acquisition: "Discuss a laundry solution",
    locations: "Laundry locations",
    ctaLabel: "Learn More",
    contentSections: [
      {
        heading: "Flexible laundry collection",
        body: "Connect convenient drop-off and collection points to the way customers already move.",
      },
    ],
  },
];

export function upsertMockProduct(product: Product) {
  const index = mockProducts.findIndex(
    (item) => item.id === product.id || item.slug === product.slug,
  );
  if (index === -1) mockProducts.push(product);
  else mockProducts[index] = product;
}
