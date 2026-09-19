import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SuccessStoriesCarousel } from "@/components/layout/success-stories-carousel";
import { ContactSection } from "@/components/marketing/contact-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/notice";
import { RichText } from "@/components/ui/rich-text";
import {
  getPublishedProductBySlug,
  getPublishedProductSlugs,
  getPublishedProducts,
} from "@/lib/products/queries";
import { toPlainText } from "@/lib/products/richtext";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import type { Product } from "@/lib/products/types";

export const revalidate = 300;

/**
 * Prerenders the product pages that exist at build time.
 *
 * Without this the route is rendered on every request — an uncached Supabase round trip per visit —
 * even though `revalidate` is set. Slugs created later still work: they render on demand and are
 * cached from then on, and a save revalidates the affected path immediately.
 */
export async function generateStaticParams() {
  const result = await getPublishedProductSlugs();
  if (!result.ok) {
    // A build must not fail because the catalogue is unreachable; the route falls back to
    // on-demand rendering.
    console.error("[products] Could not prerender product pages:", result.error);
    return [];
  }
  return result.data.map((slug) => ({ product: slug }));
}

/**
 * Product detail.
 *
 * This page is entirely CMS-driven: every word on it comes from the product record. Nothing about
 * a product is hardcoded here, so the same page serves any product a CMS user creates. The only
 * fixed copy is the shared site chrome (the enquiry section, success stories and footer), which is
 * identical on every marketing page.
 */

function toOgImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : absoluteUrl(url);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const result = await getPublishedProductBySlug(product);

  if (!result.ok) return { title: "Product" };
  if (!result.data) return { title: "Product not found" };

  const data = result.data;
  const image = toOgImage(data.imageUrl);
  // Markdown markers must not leak into a search result or a social card.
  const description = toPlainText(data.description);

  return {
    title: data.title,
    description,
    alternates: { canonical: `/products/${data.slug}` },
    openGraph: {
      type: "website",
      url: `/products/${data.slug}`,
      title: data.title,
      description,
      images: image ? [{ url: image, alt: data.imageAlt ?? data.title }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;

  const [result, relatedResult] = await Promise.all([
    getPublishedProductBySlug(product),
    getPublishedProducts(),
  ]);

  if (!result.ok) {
    return (
      <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--heading)]">
        <SiteNav />
        <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0">
          <Notice variant="error">{result.error}</Notice>
          <Link href="/products" className="mt-6 inline-block text-sm underline">
            &lsaquo;&nbsp; Back to products
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  if (!result.data) notFound();

  const productData: Product = result.data;
  const relatedProducts = relatedResult.ok
    ? relatedResult.data.filter((item) => item.slug !== productData.slug).slice(0, 6)
    : [];

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/products/${productData.slug}`;
  const heroImage = toOgImage(productData.imageUrl);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--heading)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: productData.title,
              description: toPlainText(productData.description),
              url: productUrl,
              ...(heroImage ? { image: heroImage } : {}),
              brand: { "@type": "Brand", name: "QUBE" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Products",
                  item: `${siteUrl}/products`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: productData.title,
                  item: productUrl,
                },
              ],
            },
          ],
        }}
      />

      <SiteNav />

      {/* Product header: title, facts and description — all from the CMS record. */}
      <section className="mx-auto w-full max-w-[1040px] px-6 py-4 lg:px-0">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:underline">
                Products
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--heading)]">
              {productData.title}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold leading-none lg:text-6xl">
              {productData.title}
            </h1>
            {productData.acquisition || productData.locations ? (
              <dl className="mt-16 flex flex-wrap gap-10 text-sm">
                {productData.acquisition ? (
                  <div>
                    <dt className="text-[var(--text-muted)]">Acquisition</dt>
                    <dd className="mt-1 font-bold">{productData.acquisition}</dd>
                  </div>
                ) : null}
                {productData.locations ? (
                  <div>
                    <dt className="text-[var(--text-muted)]">Locations</dt>
                    <dd className="mt-1 font-bold">{productData.locations}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>

          {productData.description ? (
            <RichText
              source={productData.description}
              className="pt-2 text-base leading-6 text-[var(--foreground)]"
            />
          ) : null}
        </div>

        {productData.imageUrl ? (
          <div className="relative mt-14 h-[300px] overflow-hidden rounded-[var(--radius-card-sm)] lg:h-[408px]">
            <Image
              src={productData.imageUrl}
              alt={productData.imageAlt ?? `${productData.title} product image`}
              fill
              sizes="(min-width: 1040px) 1040px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="mt-14 flex h-[300px] items-center justify-center rounded-[var(--radius-card-sm)] bg-[var(--surface-muted)] text-xs text-[var(--text-muted)] lg:h-[408px]">
            No product image has been added yet.
          </div>
        )}

        {productData.tags.length > 0 ? (
          <ul className="mt-14 flex flex-wrap justify-center gap-2">
            {productData.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--brand-3)] px-3 py-1 text-[10px] text-[var(--brand-ink)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Content sections. Each heading is an h2 and each body keeps the author's formatting, so
          the page grows with the content instead of being padded to a frame height. */}
      {productData.contentSections.length > 0 ? (
        <section className="mx-auto w-full max-w-[1040px] px-6 py-16 lg:px-0 lg:py-24">
          {productData.contentSections.map((section, index) => (
            <article
              key={`${section.heading}-${index}`}
              className={index > 0 ? "mt-16" : undefined}
            >
              {section.heading ? (
                <h2 className="max-w-[620px] text-3xl font-bold leading-tight">
                  {section.heading}
                </h2>
              ) : null}

              {section.body ? (
                <RichText
                  source={section.body}
                  className="mt-5 max-w-[620px] text-xs leading-5"
                />
              ) : null}

              {section.images.length > 0 ? (
                <div
                  className={`mt-6 grid gap-4 ${
                    section.images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {section.images.map((image) => (
                    <div
                      key={image.url}
                      className="relative h-64 overflow-hidden rounded-[var(--radius-card-sm)] bg-[var(--surface-muted)]"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 640px) 300px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <section className="mx-auto flex max-w-[1040px] flex-col items-center justify-center px-6 py-20 text-center lg:px-0 lg:py-28">
        <h2 className="text-2xl font-semibold">
          Ask how we can help your business
        </h2>
        <p className="mt-3 max-w-md text-xs text-[var(--text-muted)]">
          Send us your contact information and a QUBE Smart Solution Expert will
          reach out to you shortly.
        </p>
        <Link
          href="#contact"
          className="cta-gradient mt-6 rounded-[var(--radius-control)] px-6 py-3 text-xs font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Talk to an Expert
        </Link>
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

      <ContactSection sourcePath={`/products/${productData.slug}`} />

      {relatedProducts.length > 0 ? (
        <section className="mx-auto w-full max-w-[1040px] px-6 py-20 lg:px-0 lg:py-28">
          <h2 className="text-3xl font-bold">
            Array of Smart Products for every business requirements
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {relatedProducts.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/products/${related.slug}`}
                  className="block rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)] p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <div className="relative h-32 overflow-hidden rounded-[var(--radius-control)] bg-[var(--surface-muted)]">
                    {related.imageUrl ? (
                      <Image
                        src={related.imageUrl}
                        alt={related.imageAlt ?? ""}
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-bold">{related.title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {related.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
