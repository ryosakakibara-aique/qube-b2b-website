import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPublishedProducts } from "@/lib/products/queries";
import { ProductCarousel } from "@/components/products/product-carousel";
import { Button } from "@/components/ui/Button";
import { SuccessStoriesCarousel } from "@/components/layout/success-stories-carousel";
import { ContactSection } from "@/components/marketing/contact-section";
import { Notice } from "@/components/ui/notice";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore QUBE smart lockers for terminals, offices, events, and residential buildings.",
  alternates: { canonical: "/products" },
  openGraph: {
    url: "/products",
    title: "Products",
    description:
      "Explore QUBE smart lockers for terminals, offices, events, and residential buildings.",
  },
};

export default async function ProductsPage() {
  const result = await getPublishedProducts();
  const products = result.ok ? result.data : [];

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--heading)]">
      <SiteNav />

      <section className="mx-auto grid min-h-117.5 w-full max-w-260 gap-8 px-6 py-20 lg:grid-cols-2 lg:px-0 lg:py-37.5">
        <div className="max-w-130">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight lg:text-[40px] lg:leading-[1.08] lg:tracking-normal">
            Array of Smart Products for every business needs
          </h1>
          <Link
            href="#contact"
            className="cta-gradient mt-8 inline-flex h-11 items-center rounded-[var(--radius-control)] px-6 text-xs font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Talk to an Expert
          </Link>
        </div>
        <div className="flex items-end justify-start gap-2 pb-1 text-xs lg:justify-end">
          <span className="font-bold text-[var(--brand-ink)]">PANDORA 3.0</span>
          <span className="text-[var(--text-muted)]">
            Check our API Documentation
          </span>
          <span aria-hidden="true">&rarr;</span>
        </div>
      </section>

      <section className="w-full pb-28">
        {result.ok ? (
          <ProductCarousel products={products} />
        ) : (
          <div className="mx-auto max-w-[1040px] px-6 lg:px-0">
            <Notice variant="error">{result.error}</Notice>
          </div>
        )}
      </section>

      <section className="py-24 lg:py-28">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 lg:px-0">
          <h2 className="text-3xl font-semibold text-[var(--heading)]">
            Success stories
          </h2>
          <Button variant="dark">Read stories</Button>
        </div>
        <div className="mx-auto mt-6 max-w-[1440px] px-6 lg:px-0">
          <SuccessStoriesCarousel />
        </div>
      </section>

      <ContactSection sourcePath="/products" />

      <SiteFooter />
    </main>
  );
}
