/**
 * SEO / GEO surface audit.
 *
 * Phase 5 checked this surface by hand against a running server, which means it could not be
 * re-checked after a change without repeating the whole exercise, and nothing failed when the
 * surface regressed. This script is that check as one command.
 *
 *   npm run audit:seo                                    # against http://localhost:3000
 *   SEO_AUDIT_BASE_URL=https://business.qubesmartlockers.com npm run audit:seo
 *
 * It is read-only: it fetches public routes and asserts what came back. It never writes to the
 * database, never signs in, and never mutates anything.
 *
 * Exit code is 0 only when every assertion passes, so it can gate a deploy.
 */

const baseUrl = (process.env.SEO_AUDIT_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * The origin the site *claims* it is, which is not always the origin being fetched.
 *
 * `NEXT_PUBLIC_SITE_URL` is baked in at build time, so a build made without it canonicalises every
 * page to `http://localhost:3000` — correct behaviour on a developer machine, and the reason a
 * server on another port legitimately serves canonicals naming 3000. Comparing the two is only
 * meaningful when they are told apart, so the expected origin can be set independently.
 */
const expectedOrigin = (process.env.SEO_AUDIT_ORIGIN ?? baseUrl).replace(/\/+$/, "");

const timeoutMs = Number(process.env.SEO_AUDIT_TIMEOUT_MS ?? 30000);

/** Failures are collected rather than thrown, so one run reports everything that is wrong. */
const failures = [];

/** Problems that are real but accepted, or caused by a framework behaviour rather than this code. */
const warnings = [];

let checks = 0;

function fail(route, message) {
  failures.push(`${route}  ${message}`);
}

function warn(route, message) {
  warnings.push(`${route}  ${message}`);
}

function check(route, condition, message) {
  checks += 1;
  if (!condition) fail(route, message);
  return Boolean(condition);
}

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "QUBE-SEO-Audit/1.0 (+audit script)" },
  });
  const body = await response.text();
  return { status: response.status, headers: response.headers, body };
}

/** All matches of a tag regex, in document order. */
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

/** Reads one attribute out of a tag string, tolerating either attribute order. */
function attr(tag, name) {
  const doubleQuoted = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
  if (doubleQuoted) return doubleQuoted[1];
  const singleQuoted = new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i").exec(tag);
  return singleQuoted ? singleQuoted[1] : undefined;
}

function metaContent(html, matcher) {
  for (const tag of tags(html, "meta")) {
    const name = attr(tag, "name") ?? attr(tag, "property");
    if (name && matcher(name.toLowerCase())) return attr(tag, "content");
  }
  return undefined;
}

function canonicalHref(html) {
  for (const tag of tags(html, "link")) {
    if ((attr(tag, "rel") ?? "").toLowerCase() === "canonical") return attr(tag, "href");
  }
  return undefined;
}

/**
 * Same-origin check against the origin the site claims, not the one being fetched.
 *
 * A local build canonicalises to `http://localhost:3000`; the server under test may be on another
 * port. Comparing against the fetch origin would report every canonical as a mismatch, which says
 * nothing about the site.
 */
function sameHost(url) {
  try {
    return new URL(url).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function jsonLdBlocks(html) {
  const blocks = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) blocks.push(match[1]);
  return blocks;
}

/** Flattens `@graph`, arrays and bare nodes into one list of nodes. */
function flattenNodes(parsed) {
  if (Array.isArray(parsed)) return parsed.flatMap(flattenNodes);
  if (parsed && typeof parsed === "object" && Array.isArray(parsed["@graph"])) {
    return parsed["@graph"].flatMap(flattenNodes);
  }
  return parsed && typeof parsed === "object" ? [parsed] : [];
}

const FORBIDDEN_SCHEMA_KEYS = [
  "offers",
  "price",
  "priceCurrency",
  "priceValidUntil",
  "availability",
  "aggregateRating",
  "ratingValue",
  "review",
  "reviewCount",
];

function assertJsonLd(route, html) {
  const blocks = jsonLdBlocks(html);
  if (!check(route, blocks.length >= 1, "no application/ld+json block found")) return [];

  const types = [];
  for (const block of blocks) {
    let nodes;
    try {
      nodes = flattenNodes(JSON.parse(block));
    } catch (error) {
      fail(route, `structured data does not parse: ${error.message}`);
      continue;
    }

    for (const node of nodes) {
      const type = node?.["@type"];
      if (type) types.push(type);

      /*
        The project forbids fabricated commercial facts. These keys are checked negatively on
        purpose: their absence is a requirement, not an omission, so a later edit that adds a made-up
        price fails here rather than shipping.
      */
      for (const key of FORBIDDEN_SCHEMA_KEYS) {
        if (node && Object.prototype.hasOwnProperty.call(node, key)) {
          fail(route, `structured data carries fabricated commercial key "${key}" (${type})`);
        }
      }
    }
  }

  return types;
}

/**
 * The document outline, from every `<main>` on the page.
 *
 * Two things here were learned by running this against a real build rather than by reading the code:
 *
 *  1. **Collect them all.** The marketing layout streams its page inside a Suspense boundary, so the
 *     served HTML carries more than one `<main>` — the streamed shell and then the real content. A
 *     first-match extractor therefore examined only the shell and reported "0 h1 elements inside
 *     <main>" for every product page, which was a defect in this script, not in the site.
 *  2. **Do not strip `<footer>`/`<nav>` by regex.** The footer wraps its own `<nav>` and a non-greedy
 *     match ends at the first closing tag, either leaving pieces behind or swallowing real content.
 *     Taking `<main>` is the anchor that excludes the shared chrome by construction.
 */
function mainContent(html) {
  const blocks = [];
  const pattern = /<main\b[^>]*>([\s\S]*?)(?=<\/main>|<main\b|$)/gi;
  for (const match of html.matchAll(pattern)) blocks.push(match[1]);

  if (blocks.length === 0) return null;

  return blocks
    .join("\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
}

function assertHeadings(route, html) {
  const content = mainContent(html);
  if (!check(route, content !== null, "no <main> element, so the page has no landmark for its content")) {
    return;
  }

  const levels = [...content.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  const h1Count = levels.filter((level) => level === 1).length;

  check(route, h1Count === 1, `expected exactly one <h1> inside <main>, found ${h1Count}`);

  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] > levels[index - 1] + 1) {
      fail(
        route,
        `heading level jumps h${levels[index - 1]} → h${levels[index]} inside <main>, which breaks the outline`,
      );
      break;
    }
  }
}

function assertImages(route, html) {
  const images = tags(html, "img");
  const missing = images.filter((tag) => attr(tag, "alt") === undefined);
  check(
    route,
    missing.length === 0,
    `${missing.length} of ${images.length} <img> elements have no alt attribute`,
  );
}

async function assertSocialImage(route, html) {
  const image = metaContent(html, (name) => name === "og:image");
  if (!image) return; // absence is reported by the og:image check itself

  if (!check(route, /^https?:\/\//.test(image), `og:image is not absolute: ${image}`)) return;

  try {
    const response = await fetch(image, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get("content-type") ?? "";
    check(route, response.status === 200, `og:image returned ${response.status}: ${image}`);
    check(
      route,
      contentType.startsWith("image/"),
      `og:image is served as "${contentType}" rather than an image type`,
    );
  } catch (error) {
    fail(route, `og:image could not be fetched (${image}): ${error.message}`);
  }
}

async function auditRoute(path, { expectStatus = 200, indexable = true } = {}) {
  const route = path;
  let response;
  try {
    response = await get(path);
  } catch (error) {
    fail(route, `request failed: ${error.message}`);
    return null;
  }

  check(route, response.status === expectStatus, `expected HTTP ${expectStatus}, got ${response.status}`);
  if (response.status !== expectStatus) return response;

  const html = response.body;
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
  check(route, Boolean(title), "no <title>");

  const description = metaContent(html, (name) => name === "description");
  check(route, Boolean(description?.trim()), "no meta description");

  const canonical = canonicalHref(html);
  if (indexable) {
    if (check(route, Boolean(canonical), "no canonical link")) {
      check(route, /^https?:\/\//.test(canonical), `canonical is not absolute: ${canonical}`);
      check(
        route,
        sameHost(canonical),
        `canonical points at "${new URL(canonical).origin}" but the site claims "${expectedOrigin}"`,
      );
      const expected = `${expectedOrigin}${path === "/" ? "/" : path}`;
      check(
        route,
        canonical.replace(/\/$/, "") === expected.replace(/\/$/, ""),
        `canonical is "${canonical}", expected "${expected}"`,
      );
    }
  } else {
    check(route, !canonical, "a non-indexable route must not publish a canonical (it is not a destination)");
  }

  const robotsMeta = metaContent(html, (name) => name === "robots") ?? "";
  if (!indexable) {
    /*
      This is the check that matters most on a soft-404.

      An unknown product answers `200 OK` on this route (see the note in `main`), so `noindex` is the
      only thing standing between a missing page and an index entry.
    */
    check(
      route,
      /noindex/i.test(robotsMeta),
      "a non-indexable route must set noindex (or be covered by a noindex layout)",
    );
  }

  const ogTitle = metaContent(html, (name) => name === "og:title");
  const ogDescription = metaContent(html, (name) => name === "og:description");
  check(route, Boolean(ogTitle?.trim()), "no og:title");
  check(route, Boolean(ogDescription?.trim()), "no og:description");

  /*
    The outline is required of pages that are meant to be found.

    A 404 and a sign-in screen are not, and on this build the not-found view renders outside the
    streamed `<main>` shell, so demanding an `<h1>` of it would be asserting something no reader or
    crawler depends on. What these routes must get right — no canonical, and `noindex` — is checked
    above. Images are still checked everywhere: a decorative graphic without an `alt` is a fault on
    any page.
  */
  if (indexable) assertHeadings(route, html);
  assertImages(route, html);

  /*
    Social tags and structured data are required of pages that are meant to be found.

    An error page and a sign-in screen are not, and demanding an `og:image` or a `Product` node of
    them would be noise that trains whoever reads this output to ignore it. What they *do* have to get
    right — no canonical, `noindex` — is checked above.
  */
  let types = [];
  if (indexable) {
    const ogUrl = metaContent(html, (name) => name === "og:url");
    if (check(route, Boolean(ogUrl), "no og:url")) {
      check(route, /^https?:\/\//.test(ogUrl), `og:url is not absolute: ${ogUrl}`);
    }
    if (!metaContent(html, (name) => name === "og:image")) {
      fail(route, "no og:image — a share of this page renders as a bare text card");
    }
    types = assertJsonLd(route, html);
    await assertSocialImage(route, html);
  }

  return {
    status: response.status,
    title,
    description,
    canonical,
    ogImage: metaContent(html, (name) => name === "og:image"),
    types,
  };
}

function auditRobots(body) {
  const route = "/robots.txt";
  const sitemap = /^\s*sitemap:\s*(\S+)\s*$/im.exec(body)?.[1];
  if (check(route, Boolean(sitemap), "no Sitemap: line")) {
    check(
      route,
      sameHost(sitemap),
      `sitemap is advertised on "${new URL(sitemap).origin}" but the site claims "${expectedOrigin}" — ` +
        "this is the localhost-fallback defect that used to live in app/robots.ts",
    );
  }
  check(route, /disallow:\s*\/cms\//i.test(body), "the CMS is not disallowed");
  check(route, /user-agent:\s*\*/i.test(body), "no wildcard user-agent rule");
}

function auditSitemap(body) {
  const route = "/sitemap.xml";
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  check(route, urls.length >= 2, `expected at least the two static routes, found ${urls.length}`);

  const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
  check(route, duplicates.length === 0, `duplicate URLs: ${[...new Set(duplicates)].join(", ")}`);

  for (const url of urls) {
    check(route, url.startsWith(expectedOrigin), `"${url}" is not on the site's own origin`);

    const lastmod = new RegExp(`<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>\\s*<lastmod>([^<]+)</lastmod>`).exec(body)?.[1];
    if (lastmod) {
      const parsed = new Date(lastmod);
      check(route, !Number.isNaN(parsed.getTime()), `"${url}" carries an unparseable lastmod`);
      if (!Number.isNaN(parsed.getTime())) {
        check(
          route,
          parsed.getTime() <= Date.now() + 60_000,
          `"${url}" claims a lastmod in the future (${lastmod})`,
        );
      }
    }
  }

  return urls;
}

async function main() {
  const results = [];

  for (const path of ["/", "/products"]) {
    results.push(await auditRoute(path));
  }

  const robots = await get("/robots.txt");
  check("/robots.txt", robots.status === 200, `expected HTTP 200, got ${robots.status}`);
  auditRobots(robots.body);

  const sitemap = await get("/sitemap.xml");
  check("/sitemap.xml", sitemap.status === 200, `expected HTTP 200, got ${sitemap.status}`);
  const urls = auditSitemap(sitemap.body);

  // A product page is audited only when the sitemap names one, so an empty catalogue is not a
  // failure — but a catalogue the sitemap forgot to publish is.
  const productUrls = urls.filter((url) => new URL(url).pathname.startsWith("/products/"));
  for (const url of productUrls) {
    results.push(await auditRoute(new URL(url).pathname));
  }

  /*
    A missing product.

    This is reported rather than failed, and the reason is recorded rather than hidden: on Next 16.3.4
    a miss on this ISR route answers `200 OK` with the not-found view inside it, verified against a
    clean production build. The page itself is correct — it sets `noindex` — but the status is not, so
    a crawler is entitled to treat it as a thin page. `dynamicParams = false` fixes the status and was
    rejected: it turns any product missing from the build-time manifest into a hard 404, which on this
    catalogue was a live product. Until that trade changes, the audit reports the soft 404 loudly and
    exits 0, and `SEO_AUDIT_STRICT_404=1` promotes it to a failure for a run where it matters.
  */
  const strict404 = process.env.SEO_AUDIT_STRICT_404 === "1";
  const missing = await auditRoute("/products/this-product-does-not-exist-seo-audit", {
    expectStatus: strict404 ? 404 : 200,
    indexable: false,
  });
  if (missing && missing.status === 200 && !strict404) {
    warn(
      "/products/{unknown}",
      "a missing product answers 200 with a noindex not-found page (soft 404). Awaiting a status fix " +
        "that does not require dropping on-demand rendering. Set SEO_AUDIT_STRICT_404=1 to fail on it.",
    );
  }

  // Private routes: reachable is fine, indexable is not.
  await auditRoute("/cms/login", { expectStatus: 200, indexable: false });

  console.log(`\nSEO audit — ${baseUrl}`);
  console.log(`${checks} checks across ${results.length + 3} routes\n`);
  for (const result of results) {
    if (!result) continue;
    console.log(`  ${result.canonical ?? "(no canonical)"}`);
    console.log(`      title: ${result.title}`);
    console.log(`      schema: ${result.types.join(", ") || "none"}`);
  }

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):\n`);
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  if (failures.length > 0) {
    console.log(`\n${failures.length} failed check(s):\n`);
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    console.log("");
    process.exitCode = 1;
    return;
  }

  console.log("\nAll checks passed.\n");
}

await main();
