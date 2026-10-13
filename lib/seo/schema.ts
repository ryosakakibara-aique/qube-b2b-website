import type { Product } from "@/lib/products/types";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Structured data builders.
 *
 * These nodes used to be object literals written inline inside two page components, which had three
 * consequences: no test could reach them, the brand entity was spelled differently in each place
 * (`QUBE` here, `QUBE Smart Lockers` in `SITE_NAME`), and the rule that no commercial fact may be
 * fabricated was enforced by nothing but care. Building them here makes each one testable, gives the
 * entity a single source, and lets `tests/seo-schema.test.ts` assert the absence of `offers`,
 * `price`, `aggregateRating` and `review` as a property of the code rather than a promise.
 *
 * Nothing in this module invents a value. Every field either comes from a record, from a confirmed
 * constant in `lib/site.ts`, or is omitted.
 */

/** A JSON-LD node. Deliberately open: schema.org nodes are shaped per type. */
export type SchemaNode = Record<string, unknown>;

/**
 * A whole document.
 *
 * A type alias rather than an interface on purpose: only an alias is assignable to the
 * `Record<string, unknown>` that `JsonLd` accepts, because an interface has no implicit index
 * signature. Making it an interface would be a compile error at every call site.
 */
export type SchemaGraph = {
  "@context": "https://schema.org";
  "@graph": SchemaNode[];
};

/* -------------------------------------------------------------------------------------------- */
/* Entity facts. Confirmed by the client; see docs/SEO-GEO.md §7 (D1, D2, D4).                    */
/* -------------------------------------------------------------------------------------------- */

/**
 * The registered company, as confirmed by the client.
 *
 * Distinct from the public brand in `SITE_NAME`: the registered name carries the corporate suffix,
 * the brand does not, and both are correct in their own place.
 */
export const LEGAL_NAME = "QUBE Smart Technology Corp.";

/**
 * The shorter names the company is known by.
 *
 * "QUBE" is the bare mark used in the design and in page copy; "QUBE Smart Technology" is the legal
 * name without its suffix. "QUBE Smart Solution Expert" also appears in the retained page copy and
 * needs no entry of its own — it resolves to the same entity through these. The client asked for the
 * copy to be kept, so the alternates are where that variation is absorbed rather than by editing the
 * pages (docs/SEO-GEO.md §7, D3).
 */
export const ALTERNATE_NAMES = ["QUBE", "QUBE Smart Technology"];

/**
 * Profiles that genuinely exist. Emitted exactly as supplied — an invented or mistyped `sameAs` is a
 * worse signal than none, because it asserts an identity that does not hold. `www` is the
 * verified-reachable brand host (docs/SEO-GEO.md §4); the bare apex does not resolve.
 */
export const SAME_AS = [
  "https://www.linkedin.com/company/qube-smart-technology",
  "https://www.facebook.com/qubesmartlockers/",
  "https://www.qubesmartlockers.com/",
];

/** Stable identifiers, so nodes can reference each other instead of repeating strings. */
export function organizationId(siteUrl: string): string {
  return `${siteUrl}/#organization`;
}

export function websiteId(siteUrl: string): string {
  return `${siteUrl}/#website`;
}

export function webPageId(siteUrl: string, route: string): string {
  return `${siteUrl}${route === "/" ? "/" : route}#webpage`;
}

/* -------------------------------------------------------------------------------------------- */
/* Nodes                                                                                          */
/* -------------------------------------------------------------------------------------------- */

/**
 * The company.
 *
 * No `address`, no `telephone`, no `contactPoint` and no `LocalBusiness` type: none of those facts
 * has been supplied, and an empty or guessed value in structured data is worse than an absent one.
 * Add them here when real values exist — see the open items in docs/SEO-GEO.md §7.
 */
export function organizationNode(siteUrl: string): SchemaNode {
  return {
    "@type": "Organization",
    "@id": organizationId(siteUrl),
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    alternateName: ALTERNATE_NAMES,
    url: siteUrl,
    logo: absoluteUrl("/qube-logo.svg"),
    description: SITE_DESCRIPTION,
    sameAs: SAME_AS,
  };
}

/**
 * The site as an entity.
 *
 * No `potentialAction`/`SearchAction`: the site has no search endpoint, and declaring one would
 * advertise a URL that cannot answer the query.
 */
export function websiteNode(siteUrl: string): SchemaNode {
  return {
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    publisher: { "@id": organizationId(siteUrl) },
    inLanguage: "en",
  };
}

/** The page itself, tied to the site and to the company that publishes it. */
export function webPageNode(
  siteUrl: string,
  route: string,
  name: string,
  description?: string,
): SchemaNode {
  return {
    "@type": "WebPage",
    "@id": webPageId(siteUrl, route),
    url: `${siteUrl}${route === "/" ? "/" : route}`,
    name,
    ...(description ? { description } : {}),
    isPartOf: { "@id": websiteId(siteUrl) },
    about: { "@id": organizationId(siteUrl) },
    inLanguage: "en",
  };
}

/**
 * The catalogue, as an ordered list of the products the page actually renders.
 *
 * `itemListElement` is built from the same array the page maps over, so the list cannot describe a
 * catalogue the visitor cannot see. Position is 1-based per schema.org.
 */
export function itemListNode(
  siteUrl: string,
  products: Array<Pick<Product, "slug" | "title">>,
): SchemaNode {
  return {
    "@type": "ItemList",
    "@id": `${siteUrl}/products#itemlist`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${siteUrl}/products/${product.slug}`,
    })),
    numberOfItems: products.length,
  };
}

/**
 * A product, described only by what the record contains.
 *
 * `description` must already be plain text — the caller reduces the stored markdown with
 * `toPlainText`, as the page metadata does — so formatting markers cannot leak into structured data.
 * Tags become `category`, which is what they are: the product's own vocabulary, not a taxonomy
 * invented here.
 *
 * `acquisition` and `locations` are deliberately **not** emitted as `additionalProperty`: the client
 * retained the existing copy, and those fields hold display strings rather than confirmed facts. They
 * stay on the page as visible content, which is where a human and a model can read them.
 */
export function productNode(
  siteUrl: string,
  product: Pick<Product, "slug" | "title" | "tags">,
  options: { description?: string; image?: string } = {},
): SchemaNode {
  const url = `${siteUrl}/products/${product.slug}`;

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    url,
    ...(options.description ? { description: options.description } : {}),
    ...(options.image ? { image: options.image } : {}),
    ...(product.tags.length > 0 ? { category: product.tags } : {}),
    // Referenced, not repeated: the brand is the organization node already in this graph, so the
    // entity name has exactly one spelling site-wide.
    brand: { "@id": organizationId(siteUrl) },
    isPartOf: { "@id": webPageId(siteUrl, `/products/${product.slug}`) },
  };
}

/** A breadcrumb trail. The visible trail and this node are built from the same call site. */
export function breadcrumbNode(
  siteUrl: string,
  items: Array<{ name: string; path: string }>,
): SchemaNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${siteUrl}${items[items.length - 1]?.path ?? "/"}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

/** Assembles a graph, dropping any node that came back empty. */
export function graph(nodes: Array<SchemaNode | null | undefined>): SchemaGraph {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is SchemaNode => Boolean(node)),
  };
}
