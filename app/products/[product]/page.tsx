import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { getProductBySlug, getProducts } from "@/lib/products/queries";
import type { Product } from "@/lib/products/types";

const stories = [
  "International School Manila",
  "Jollibee",
  "KMC",
  "Lucima",
  "PITX",
];

const pandoraContent = {
  intro:
    "Convenient smart lockers that serve as 24/7 pickup and drop-off points for laundry shops, making it easy to leave and collect your laundry anytime.",
  sections: [
    [
      "WASH",
      "Expand your laundry’s reach without building another branch - more efficient, more affordable, faster expansion. With the real-time data dashboard, you can monitor your customers transactions on-demand, remotely. With very informative statistics for more insightful, strategic adjustments.",
    ],
    [
      "DROP",
      "Simply drop off your parcel at any of our convenient locations — no appointment needed. Our friendly staff will sort, tag, and process your items with care. With flexible drop-off hours and multiple access points across the city, accepting parcels with your busy schedule has never been easier.",
    ],
    [
      "KEEP",
      "Need your favorite outfit stored safely? Our keep service lets you store seasonal clothing and bulky items in our climate-controlled facility. Access your wardrobe anytime through our app, and we'll have your items freshly pressed and ready for pickup within hours of your request.",
    ],
    [
      "PAY",
      "Pay only for what you use — no hidden fees, no subscriptions required. Our transparent pricing is calculated by weight and garment type, with real-time cost estimates before you confirm. Choose from multiple payment options including in-app payments, contactless tap, or monthly invoicing for business accounts.",
    ],
  ],
  useCases:
    "As a property manager - add a premium amenity that boosts tenant satisfaction and retention without the overhead of managing equipment\nAs a laundry merchant - expand your reach and grow revenue by connecting with residential buildings ready for modern laundry solutions\nAs an investor - tap into a recession-resistant, recurring-revenue model in the P20k+ shared laundry market\nFor your business amenity - offer employees and guests on-site laundry convenience that elevates your workplace experience",
};

function detailContent(product: Product) {
  if (product.slug === "pandora") return pandoraContent;
  return {
    intro: product.description,
    sections: product.contentSections.map((section) => [
      section.heading,
      section.body,
    ]),
    useCases:
      "For businesses that need secure, convenient storage, QUBE products provide a flexible experience for customers, teams, and operators.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const productData = await getProductBySlug(product);
  if (!productData) return { title: "Product not found" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: productData.title,
    description: productData.description,
    alternates: { canonical: `${siteUrl}/products/${productData.slug}` },
    openGraph: {
      title: productData.title,
      description: productData.description,
      url: `${siteUrl}/products/${productData.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  const productData = await getProductBySlug(product);
  if (!productData) notFound();
  const content = detailContent(productData);
  const relatedProducts = (await getProducts())
    .filter((item) => item.slug !== productData.slug)
    .slice(0, 6);

  return (
    <main className="min-h-screen space-y-6 overflow-hidden bg-[#f1f5f9] text-[#3f3f46]">
      <SiteNav />
      <section className="mx-auto min-h-[796px] w-full max-w-[1040px] px-6 py-4 lg:px-0 lg:py-4">
        <Link
          href="/products"
          className="text-sm text-[#52525b] hover:text-[#18181b]"
        >
          ‹&nbsp; Products
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold leading-none lg:text-6xl">
              {productData.title}
            </h1>
            <div className="mt-16 flex gap-10 text-sm">
              <div>
                <p className="text-[#71717a]">Acquisition</p>
                <p className="mt-1 font-bold">{productData.acquisition}</p>
              </div>
              <div>
                <p className="text-[#71717a]">Locations</p>
                <p className="mt-1 font-bold">{productData.locations}</p>
              </div>
            </div>
          </div>
          <div className="pt-2 text-base leading-6 text-[#94a3b8]">
            <p>
              The most advanced smart locker in the Philippines - from logistics
              to lifestyle solutions, a key component in building smarter city
            </p>
            <p className="mt-5">
              To expand your business reach, to optimize your business
              operations, and for better experience for your customers
            </p>
          </div>
        </div>
        <div
          className="mt-14 h-[300px] rounded-2xl bg-[#e2e8f0] lg:h-[408px]"
          aria-label={
            productData.imageAlt ?? `${productData.title} product image`
          }
        />
        <div className="mt-14 flex flex-wrap justify-center gap-2">
          {productData.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#10b9b8] px-3 py-1 text-[10px] text-[#0e8e8f]"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto min-h-[2192px] w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <h2 className="max-w-[620px] text-3xl font-bold leading-tight">
          Multi-service platform - for every business needs
        </h2>
        <p className="mt-5 max-w-[620px] text-xs leading-5">{content.intro}</p>
        <div className="mt-8 max-w-[620px] space-y-5">
          {content.sections.map(([heading, body]) => (
            <article key={heading}>
              <h3 className="text-xs font-bold">{heading}</h3>
              <p className="mt-1 text-xs leading-5">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div
            className="h-64 rounded-2xl bg-[#e2e8f0]"
            aria-label="Product content image"
          />
          <div
            className="h-64 rounded-2xl bg-[#e2e8f0]"
            aria-label="Product content image"
          />
        </div>
        <h2 className="mt-16 text-3xl font-bold leading-tight">
          When we say for every business needs
        </h2>
        <p className="mt-5 max-w-[620px] whitespace-pre-line text-xs leading-5">
          {content.useCases}
        </p>
        <div
          className="mt-8 h-64 rounded-2xl bg-[#e2e8f0]"
          aria-label="Product use cases image"
        />
        <h2 className="mt-16 text-3xl font-bold">Customizability</h2>
        <p className="mt-5 max-w-[620px] text-xs leading-5">
          From hardware to software - services to pricing, you can customize the{" "}
          {productData.title} system according to your preference.
        </p>
      </section>

      <section className="mx-auto flex min-h-[376px] max-w-[1040px] flex-col items-center justify-center px-6 text-center lg:px-0">
        <h2 className="text-2xl font-semibold">
          Ask how we can help your business
        </h2>
        <p className="mt-3 max-w-md text-xs text-[#71717a]">
          Send us your contact information and a QUBE Smart Solution Expert will
          reach out to you shortly.
        </p>
        <Link
          href="#contact"
          className="mt-6 rounded-xl bg-[#10b9b8] px-6 py-3 text-xs font-bold text-white"
        >
          Talk to an Expert
        </Link>
      </section>

      <section className="min-h-[618px] py-20 lg:py-28">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 lg:px-0">
          <h2 className="text-2xl font-semibold">Success stories</h2>
          <button className="rounded-xl bg-[#27272a] px-5 py-2 text-xs font-bold text-white">
            Read stories
          </button>
        </div>
        <div className="mx-auto mt-6 flex max-w-[1440px] gap-3 overflow-hidden px-6 lg:px-0">
          {stories.map((story) => (
            <article
              key={story}
              className="flex min-h-[210px] min-w-[240px] flex-1 flex-col justify-end rounded-2xl bg-[#18181b] p-6 text-white"
            >
              <p className="text-base font-semibold">{story}</p>
              <span className="mt-8 text-xs text-[#a1a1aa]">Read Story →</span>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="mx-auto min-h-[568px] grid w-full max-w-[1040px] gap-8 px-6 py-20 lg:grid-cols-2 lg:px-0"
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
              All transactions are reflected once they are made.
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

      <section className="mx-auto min-h-[280px] w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
        <h2 className="text-3xl font-bold">
          Array of Smart Products for every business requirements
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {relatedProducts.map((related) => (
            <Link
              key={related.id}
              href={`/products/${related.slug}`}
              className="rounded-2xl border border-[#dbe3ec] p-4"
            >
              <div className="h-32 rounded-xl bg-[#e2e8f0]" />
              <h3 className="mt-3 text-sm font-bold">{related.title}</h3>
              <p className="mt-1 text-xs text-[#71717a]">
                {related.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="min-h-[367px] border-t border-[#cbd5e1] py-12">
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
