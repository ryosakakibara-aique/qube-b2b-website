import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { getProducts } from "@/lib/products/queries";
import { ProductCoverflow } from "@/components/layout/product-coverflow";
import { ProductCarousel } from "@/components/products/product-carousel";
import { Button } from "@/components/ui/Button";
import { SuccessStoriesCarousel } from "@/components/layout/success-stories-carousel";

const storyNames = [
  "International School Manila",
  "Jollibee",
  "KMC",
  "Lucima",
  "PITX",
];

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f1f5f9] text-[#18181b]">
      <SiteNav />
      <section className="mx-auto grid min-h-117.5 w-full max-w-260 gap-8 px-6 py-20 lg:grid-cols-2 lg:px-0 lg:py-37.5">
        <div className="max-w-130">
          <h1 className="text-4xl font-semibold leading-[1.08] lg:text-[40px]">
            Array of Smart Products for every business needs
          </h1>
          <Link
            href="#contact"
            className="mt-8 inline-flex h-11 items-center rounded-xl bg-[#10b9b8] px-6 text-xs font-bold text-white"
          >
            Talk to an Expert
          </Link>
        </div>
        <div className="flex items-end justify-end gap-2 pb-1 text-xs">
          <span className="font-bold text-[#0e8e8f]">PANDORA 3.0</span>
          <span className="text-[#71717a]">Check our API Documentation</span>
          <span aria-hidden="true">→</span>
        </div>
      </section>

      <section className="w-full pb-28">
        <ProductCarousel products={products} />
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
