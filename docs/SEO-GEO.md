# SEO, GEO and Crawl-Relevant Optimisation — Implementation Plan

**Status:** **partly implemented.** Package A, Package B, Package C and the crawl-efficiency parts
of Packages D and E have landed in code. Packages F (console setup) and the parked D4 remain open.
See **§5.1 Implementation status** for exactly what changed and where this plan turned out to be
wrong. Nothing in §5.1 is claimed without a code reference.
**Scope decided:** see §7. **Non-goals** are listed in §1 and are as binding as the work items.
**Prepared against:** the repository at the state described in §2, and three read-only fetches of the
live hosts (§4).

This document is the plan. Where a package has landed, §5.1 says so and names the file; until a
package appears there it has not been done. The evidence sections a completed plan would carry are
built up in §8 as work lands.

---

## 1. Scope, grounding and non-goals

| Workstream | Why it is in scope |
| --- | --- |
| **Technical SEO** | `CLAUDE.md` §SEO enumerates the required surface. Most of it exists; two items are wrong today (G1, G2) and one is missing entirely (G4). |
| **GEO / LLM discoverability** | `CLAUDE.md` §LLM / AI Discoverability makes this a first-class web-quality requirement and names the manipulation it forbids. |
| **Performance — crawl-relevant only** | Core Web Vitals and crawl budget are SEO inputs. The hero embed (G14) and the un-pruned `public/` directory (G15) are the two concrete costs. |
| **Accessibility — outline-relevant only** | Heading outline, link text and duplicated anchors are read by assistive technology and answer engines alike. The remainder of accessibility is already Phase 5 evidence and stays there. |

### Non-goals

Recorded so they are not re-proposed. Each is either forbidden by `CLAUDE.md` or unsupported by
content that exists.

- No AI-only pages, no cloaking, no machine-targeted duplicate content.
- No artificial FAQ blocks or FAQ schema. The business-features grid already answers the obvious
  questions in prose and is not to be recast as markup theatre.
- No fabricated structured data. `offers`, `price`, `aggregateRating`, `review`,
  `priceValidUntil` and `availability` stay absent until real data exists. The **absence is
  asserted by test** (§3, Package G).
- No `Service` schema — no service page exists.
- No `SearchAction` — the site has no search endpoint, and declaring one would advertise a URL that
  cannot be satisfied.
- No rewriting of public marketing copy or link text. **Dropped by client decision** (§7, D3);
  package A7/B7 in the originating analysis is withdrawn.
- No replacement of the hero video. **Retained by client decision** (§7, D5).
- No change to the canonical hostname (§4).
- No second CMS entity, no new runtime dependency, no analytics script — the last is a recorded
  decision, not an omission (§7, D6).

---

## 2. Verified baseline

State confirmed by reading the files named, not inferred.

| Item | State | Location |
| --- | --- | --- |
| `metadataBase` from `NEXT_PUBLIC_SITE_URL`, with a production fallback to the real origin | correct | `lib/site.ts` `resolveSiteUrl`/`getSiteUrl`; `app/layout.tsx` |
| Title template, site description, `og:type`/`siteName` | present | `app/layout.tsx` |
| Favicon pair selected by colour scheme, `/favicon.ico` served from `public/` | present; artwork caveats recorded in `CLAUDE.md` | `app/layout.tsx` |
| Per-route `title`, `description`, `canonical`, `og:url` on `/` | present | `app/(marketing)/page.tsx` |
| Same on `/products` | present | `app/(marketing)/products/page.tsx` |
| `generateMetadata` on product detail; description reduced via `toPlainText`; absolute `og:image` | present | `app/(marketing)/products/[product]/page.tsx` |
| `Organization` + `WebSite` in a `@graph` with stable `@id`s | present | `app/(marketing)/page.tsx` |
| `Product` + `BreadcrumbList` on the detail route, no fabricated commercial keys | present; Phase 5 verified live | `app/(marketing)/products/[product]/page.tsx` |
| `JsonLd` escapes `<` so stored content cannot terminate the element early | correct | `components/seo/json-ld.tsx` |
| `noindex, nofollow` on CMS routes | present | `app/(cms)/layout.tsx`; `app/(auth)/cms/login/page.tsx` |
| Sitemap omits URLs it cannot verify and publishes static routes on a read failure | correct, keep | `app/sitemap.ts` |
| Product pages prerendered with 5-minute ISR | present | `generateStaticParams` + `revalidate = 300` |
| Public reads use a cookie-free client, so public routes stay cacheable | present | `lib/supabase/public.ts`, `lib/products/queries.ts` |
| ~13 published products with real content; tags and section galleries in use | live | verified at `business.qubesmartlockers.com/products` |

Already-recorded gaps that this plan does **not** re-open: typography unverified (D2/D3), mobile
layout inferred, motion cost ~32 KB gzipped per marketing page (D9), PANDORA showcase images paired
by shape, existing products lacking card images, hero video being a stand-in. These remain in
`CLAUDE.md` §Known gaps and `docs/DEVELOPMENT-PHASES.md`.

---

## 3. Audit

`P0` = wrong or missing today. `P1` = materially improves discoverability. `P2` = polish or scale.

### 3.1 Defects

| # | Finding | Location | Severity |
| --- | --- | --- | --- |
| **G1** | `robots.ts` reads `process.env.NEXT_PUBLIC_SITE_URL` **directly** and falls back to `http://localhost:3000`, bypassing `resolveSiteUrl()`. A production build missing the variable therefore advertises `Sitemap: http://localhost:3000/sitemap.xml` while every canonical points at the real origin. | `app/robots.ts` | P0 |
| **G2** | `sitemap.ts` stamps `lastModified = new Date()` on every entry on every run. `Product.updatedAt` already exists and is unused here, so a real content edit is indistinguishable from a rebuild. | `app/sitemap.ts` | P0 |
| **G3** | Carousel and related-product tiles render `product.description` — the **raw markdown source** — so `**bold**` and `- list` markers can appear as literal text in card body copy. The detail metadata already reduces the same field with `toPlainText`, so the two paths disagree. | `components/products/product-carousel.tsx`; `app/(marketing)/products/[product]/page.tsx` | P0 |
| **G4** | **No Open Graph image anywhere.** No `app/opengraph-image.*`, no `images` key on `/` or `/products`, no fallback. Product pages get one only when the record carries a hero image. | `app/layout.tsx` and both marketing routes | P0 — **parked** (§7, D4) |
| **G5** | No Twitter/X card metadata. Depends on G4. | root layout | P0 — blocked by D4 |
| **G6** | **Entity naming disagrees in three directions.** `SITE_NAME` is `QUBE Smart Lockers`; `Organization.name` and `Product.brand.name` are the bare `QUBE`. Answer engines resolve entities by consistent name plus `sameAs`; three variants are three weak signals instead of one strong one. Page copy also says "QUBE Smart Solution Expert", which is **retained** and therefore must be absorbed as an `alternateName`. | `lib/site.ts`; `app/(marketing)/page.tsx`; `app/(marketing)/products/[product]/page.tsx` | P0 |
| **G7** | No `WebPage` node on any route; `/products` emits no page-level or list-level schema; product pages do not join to the `Organization` `@id`. | both marketing routes | P1 |
| **G8** | `Organization` carries no `legalName` and no `sameAs`. No `public/llms.txt` or equivalent exists. | `app/(marketing)/page.tsx` | P1 |
| **G9** | Footer outline is wrong: two `<h2>` elements ("Explore", "Account") sit inside `<footer>` **after** the page's `h2`-level section headings, inventing subsections that are not page sections. | `components/layout/site-footer.tsx` | P1 |
| **G10** | `SuccessStoriesCarousel` duplicates its whole sequence in source to make the CSS loop seamless, so the served HTML contains **16 anchors** for 8 cards, every one of them `href="#"`, each repeating the same logo `alt` text. Verified in the component, not inferred from the rendered page. `ClientLogoMarquee` does not have this problem — its duplicates are empty `aria-hidden` spacers and the logos render once. | `components/layout/success-stories-carousel.tsx` | P1 |
| **G11** | `ProductCarousel` renders three full copies of the catalogue's links and copy into the HTML. `aria-hidden` and `tabIndex={-1}` correctly remove the filler copies from assistive technology, but a parser still sees the anchors and text. | `components/products/product-carousel.tsx` | P1 — **left as-is, see §5.1** |
| **G12** | `public/` held twenty unreferenced files: eight `detail-*.png`, seven `section-*.png`, `hero-demo.png` and the create-next-app leftovers (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`). **Partly corrected during implementation:** `section-pandora.png` and `hero-demo.png` are referenced by `supabase/seed/001_products.sql` as seed image paths, so they are live fixtures rather than leftovers and were kept. The other eighteen were removed. | `public/` | P1 — **done, see §5.1** |
| **G13** | Card images use `alt=""` with an `sr-only` text sibling; related tiles reuse the **hero** (2000×800) image for a 300 px square slot; `sizes` is absent on card images and hardcoded to `300px` on related tiles. | `components/products/product-carousel.tsx`; detail route | P2 |
| **G14** | The hero is a third-party YouTube iframe — main-thread and network cost on the LCP-critical page. **Retained by client decision** (§7, D5); recorded so the cost is not mistaken for an oversight. | `components/layout/hero-video-section.tsx` | P1, accepted |
| **G15** | `/cms/login` was linked from the public footer. It is `noindex` and `robots`-disallowed, so it was harmless, but it spent public link equity and crawl budget on a private page. **Resolved on the client's instruction: the link is gone from the footer and from the navbar and its collapsed panel — the CMS is URL-only.** | `components/layout/site-footer.tsx`, `components/layout/site-nav.tsx`, `components/layout/mobile-nav.tsx` | P2 — **done** |

### 3.2 Live-host findings

Observed by read-only fetch of the three hosts. See §4.

| # | Finding | Severity |
| --- | --- | --- |
| **G16** | The Render instance **spun down**: the first request after idle returned `503 Render — Application loading`, and a request moments later returned `200`. A crawler or uptime monitor can hit that 503, and a persistent 503 is treated as a signal to drop URLs. Hosting configuration, not code. | P1 |
| **G17** | The **apex domain is dead.** `https://qubesmartlockers.com/` returns Cloudflare `Error 1001 — DNS resolution error: unable to resolve your requested domain`, i.e. the bare domain does not resolve at all, over HTTP or HTTPS. Anyone typing the address without `www` gets an error page. GoDaddy DNS configuration; outside this repository. | P2 |

### 3.3 Recorded, not actioned

- `--text-muted` on `--background` measures 4.41:1 — marginally below AA for normal text. Already
  recorded in `docs/DEVELOPMENT-PHASES.md` as a design-palette property. Not an SEO item; leave as
  a client design decision unless asked.
- The known ~32 KB-gzipped motion cost per marketing page (D9) is **out of scope**. It is a client
  decision with an accepted LCP consequence and is not re-litigated here.

---

## 4. Canonical host — resolved

The originating analysis flagged a possible conflict between the configured canonical origin and the
apex domain supplied for `sameAs`. **It is resolved, and no canonical changes are required.**

| Host | Observed | Reading |
| --- | --- | --- |
| `https://www.qubesmartlockers.com/` | `200` — *"QUBE - Smart Locker Solutions \| Secure Storage & IoT Solutions"*, a separate site with its own navigation and app-store links | A **different site**, not this repository |
| `https://qubesmartlockers.com/` (apex, and over plain HTTP) | Cloudflare `Error 1001`, DNS resolution error | Does not resolve; see G17 |
| `https://business.qubesmartlockers.com/` | `503` on first call, `200` moments later | Cold start; see G16 |
| `https://business.qubesmartlockers.com/products` | `200`, 13 products with real content | This repository, live |

**Conclusion.** `https://business.qubesmartlockers.com` remains the canonical origin exactly as
configured in `lib/site.ts`, `NEXT_PUBLIC_SITE_URL` and `render.yaml`. `https://www.qubesmartlockers.com/`
belongs in `Organization.sameAs` as supplied — and it is the **verified-reachable** brand host, which
makes the `www` form correct rather than merely accepted.

---

## 5. Work packages

Each package lists its objective, its changes, and how it is verified. `A → B → C → E → D → F`, with
`G` alongside from `A` onward.

### Package A — Make the audit reproducible

**Objective.** Turn the ad-hoc Phase 5 SEO checks into one repeatable command, so every later package
is proved rather than asserted. **This package changes no product code.**

1. Add `npm run audit:seo` — a Node script using the built-in test runner, consistent with the
   existing suites and adding no dependency. Against a running server it asserts, per public route:
   exactly one `<title>`, one `<meta name="description">`, one `<link rel="canonical">`; the
   canonical is absolute and its host equals `NEXT_PUBLIC_SITE_URL`; `og:title`, `og:description`,
   `og:url` and `og:image` are present and the image URL returns `200` with an image content type;
   exactly one `<h1>` and no skipped heading level **within `<main>`** (the footer outline is
   reported separately); every `<img>` carries an `alt` attribute; each JSON-LD block parses and
   contains none of `offers`, `price`, `aggregateRating`, `review`; and a missing product returns a
   real `404` status.
2. Record the baseline output. G1, G2, G3, G4 and G10 become **failing assertions first** — that is
   what proves they were real rather than stylistic.

**Verify.** The script runs, and its failures are exactly the listed findings. No other route
regresses.

### Package B — Technical SEO foundation

| Item | Change |
| --- | --- |
| B1 **(G1)** | `robots.ts` resolves its origin through `getSiteUrl()` instead of reading `process.env` directly. |
| B2 **(G2)** | The sitemap reads the record's real `updatedAt` for product entries, keeps a build-time date for the two static routes, and can never emit a future `lastModified`. |
| B3 | Sitemap completeness: keep the existing "never emit an unverifiable URL" behaviour, which is correct. Whether to emit sitemap `images` is deferred to B4, since it depends on the image contract. |
| B4 **(G4, G5)** | **Parked** — see §7 D4. Decide the fallback asset, then add `og:image` defaults at the root layout and the `twitter: { card: "summary_large_image" }` block it unblocks. |
| B5 | Move `og:type`, `og:siteName`, `og:locale`, `og:title`, `og:description` defaults to the root layout so no route can omit them, keeping per-route overrides. |
| B6 **(G9, G15)** | Demote the footer's "Explore"/"Account" headings from `<h2>` to `<h3>`; the `<nav aria-label="Footer">` stays. **Done**: headings demoted, and the client then had the `/cms/login` entry removed from the footer as well — the two-column footer nav collapsed into one list with the sitemap moved into it. |
| B7 | 404 hygiene: confirm `app/not-found.tsx` and the detail route's `notFound()` return a real `404` with no canonical, and emit `robots: { index: false }` on the not-found view if Next does not already. |

**Verify.** Package A's script passes the origin, `lastmod` and 404 assertions;
`tests/site.test.ts` is extended and joined by `tests/robots.test.ts` and `tests/sitemap.test.ts`, so
neither crawler file can drift from `lib/site.ts` again — the same pattern that already keeps the
Server Action body limit and the storage cap in step.

### Package C — Entity alignment and structured data

1. **C1 (G6)** Encode the decided naming: `Organization.name` = `QUBE Smart Lockers`,
   `legalName` = `QUBE Smart Technology Corp.`, `alternateName` = `["QUBE", "QUBE Smart Technology"]`,
   and `Product.brand.name` = `QUBE Smart Lockers`. **Page copy is untouched** — the retained
   "QUBE Smart Solution Expert" phrasing is absorbed as an alternate name rather than edited.
2. **C2** Add `lib/seo/schema.ts` exporting `organizationNode`, `websiteNode`, `webPageNode`,
   `productNode`, `breadcrumbNode` and `itemListNode`. The nodes are currently inline object literals
   inside JSX, which cannot be unit-tested; the repository's convention is that testable logic lives
   outside components.
3. **C3 (G8)** Enrich `Organization` with the confirmed `sameAs` (LinkedIn, Facebook,
   `https://www.qubesmartlockers.com/`), `legalName`, `alternateName`, absolute `logo` and a
   description. `contactPoint` is emitted **only if** a real public phone or email is supplied; no
   address is invented, and `LocalBusiness` is used only if a verifiable location exists — none is
   documented.
4. **C4 (G7)** Add one `WebPage` node per route with `isPartOf` → `WebSite`, `about` → `Organization`,
   and `breadcrumb` where a breadcrumb exists. Product pages reference `#organization` rather than
   repeating a bare brand string.
5. **C5 (G7)** Add `ItemList` to `/products`, enumerating exactly the published products the page
   renders.
6. **C6** Product node accuracy without invention: keep `name`, `description`, `url`, `image`,
   `brand`; add `category` from the product's own tags; add `additionalProperty` for
   `acquisition`/`locations` **only if** the client confirms those are stable facts rather than
   marketing values. `offers`/`price`/`aggregateRating`/`review` remain absent by rule.
7. **C7** Heading-outline pass inside `<main>` on all three routes after the schema edits, to confirm
   no level is skipped. The business-features grid (`h2` → `h3`) and the trend sections are correct
   today and are expected to stay so.

**Verify.** Each route's JSON-LD parses and matches a golden fixture; the anti-fabrication assertions
hold; `@id` joins resolve to nodes that exist in the same graph.

### Package D — GEO: content shaped for extraction

Deliberately downstream of C: extractability without entity consistency amplifies confusion rather
than understanding.

1. **D-1 Self-contained fact blocks.** Product pages expose a stable summary of what the product is,
   seeded from the existing `<dl>` (Acquisition / Locations). Only fields the record actually has are
   rendered. Nothing is placed in an accordion or behind a client interaction, which `CLAUDE.md`
   forbids for critical public content.
2. **D-2 `public/llms.txt`.** A short static map: canonical origin, one-line entity description, the
   public routes, the product-index route, the CMS exclusion, and the canonical naming rule. Treated
   as a courtesy document and **not** as a ranking mechanism — no per-page duplicate content, no
   instructions addressed to models.
3. **D-3 Retained copy, consistent entity.** Because the copy is retained (§7, D3), entity consistency
   is achieved in the machine-readable layer only. The retained body phrasing is mapped through
   `alternateName`, and no page text changes.
4. **D-4 (G10, G11) Duplication discipline.** Keep both visual loops. Make the initial HTML carry one
   authoritative copy of each link and its copy, with filler copies reduced to geometry-only. For
   `SuccessStoriesCarousel` this is small: the eight duplicated anchors are the loop seam, and the
   duplication can move out of the served markup. For `ProductCarousel` this is the **highest-risk
   item in the plan** — it must not regress the drag, the reduced-motion path, or the "exactly one
   reachable copy" rule already implemented. If it cannot be done without regressing the gesture,
   **stop and report** rather than degrade the carousel.
5. **D-5** Client content replacement for the borrowed video and remaining generic copy. Tracked as
   content, owned by the client, not a code change.

**Rejected on purpose** (repeated from §1 because this is where they would otherwise creep back in):
FAQ markup, `speakable`, hidden text layers, AI-only routes, `Service`, `SearchAction`.

### Package E — Crawl efficiency and Core Web Vitals

1. **E1 (G12)** Prune `public/`: remove the unreferenced design-reference PNGs and create-next-app
   leftovers after Package A asserts zero references, keeping the favicons, logos and whatever asset
   B4 settles on.
2. **E2 (G13)** Complete `sizes` on card and related-tile images; decide whether related tiles should
   use the card image where one exists — a **display-slot** choice, explicitly **not** a hero/card
   fallback, which is a recorded "no fallback" decision. Leave the `sr-only` + `alt=""` card pattern
   alone; it is deliberate and correct.
3. **E3** Re-verify after **every** package that `/`, `/products` and `/products/[slug]` still return
   `HIT` with `s-maxage=300`. Phase 5 already found this route silently uncached once, and it is the
   easiest property for a metadata or schema change to break again via an accidental `cookies()` read.
4. **E4 (G14)** The hero embed is retained by decision. No change; recorded so the CWV cost is
   understood as accepted.

### Package F — Measurement

Confirmed scope: **in-repo work, plus console setup and a baseline. No analytics dependency.**

1. Verify `business.qubesmartlockers.com` in **Google Search Console** (DNS TXT via GoDaddy) and
   submit `/sitemap.xml`; repeat for **Bing Webmaster Tools**.
2. Capture a **before** baseline — Core Web Vitals field data and index coverage — *before* the
   packages land, so effects are attributable. Without this, no later claim about improvement is
   supportable.
3. **G16:** confirm whether the Render instance spins down, or accept cold starts knowingly. A
   crawler hitting `503` on an idle instance is a real indexing risk. If the service must stay warm,
   the honest options are a paid always-on instance or an external uptime ping; both are hosting
   decisions with a cost.
4. **G17:** report the dead apex to whoever owns the domain, with the Cloudflare `Error 1001` evidence
   and the recommended fix (apex → `www` redirect at GoDaddy). Outside this repository.
5. **D6:** no analytics script. `CLAUDE.md` requires a new dependency to be justified, and Search
   Console already supplies impressions, queries, CTR, position and CWV. The genuine gap is
   enquiry-funnel visibility, which is a product question, and enquiries are already durable in
   `contact_submissions` and read at `/cms/inquiries`.

### Package G — Guardrails

Added as each package lands, in the existing `node:test` style and modelled on the tests that already
lock cross-file invariants.

| Test | Invariant |
| --- | --- |
| `tests/robots.test.ts` | The `robots.txt` sitemap host equals `getSiteUrl()` under every environment permutation, including a production build with the variable unset. |
| `tests/sitemap.test.ts` | Static routes always present; product URLs only from verified reads; `lastModified` never in the future. |
| `tests/seo-schema.test.ts` | No node builder emits `offers`, `price`, `aggregateRating`, `review`, `availability` or `priceValidUntil`; product `name`, `url` and `image` come from the record; `@id`s are absolute and stable. |
| `tests/seo-entity.test.ts` | One brand-name constant is the single source of the entity name across JSON-LD and metadata. |
| `tests/seo-surface.test.ts` | Every marketing route exports metadata with a canonical and a description; CMS routes are `noindex`. |
| `tests/og-image.test.ts` | Once B4 is unblocked: the declared asset exists in `public/`, is 1200×630, and is referenced by the root layout. |

---

## 5.1 Implementation status

Landed against this plan. Each row names the file that changed, so the claim is checkable.

| Package | Status | Files |
| --- | --- | --- |
| **A** — audit harness | **done** | `scripts/audit-seo.mjs`; `npm run audit:seo` in `package.json` |
| **B1** — one origin resolver for `robots.ts` | **done** | `app/robots.ts` |
| **B2/B3** — honest sitemap `lastmod` | **done** | `app/sitemap.ts`, `lib/seo/dates.ts`, `lib/products/queries.ts` |
| **B4/B5** — OG image and Twitter card | **parked**, see §7 P1 | — |
| **B6** — footer outline, `/cms` link | **done**: headings demoted to `<h3>`, and the `/cms/login` entry removed from the footer (and the navbar) on the client's instruction — closing O3/G15. The footer nav is one list now, with the sitemap in it | `components/layout/site-footer.tsx`, `components/layout/site-nav.tsx` |
| **B7** — 404 hygiene | **done** | `app/not-found.tsx`, `app/(marketing)/products/[product]/page.tsx` |
| **C1–C6** — entity naming, schema builders, `WebPage`, `ItemList` | **done** | `lib/seo/schema.ts` (new); all three marketing routes |
| **C7** — heading outline pass | **done**, and now machine-checked by the audit script | — |
| **D-1** — self-contained fact blocks | **already satisfied** by the existing `<dl>`; no change made | — |
| **D-2** — `llms.txt` | **done** | `public/llms.txt` |
| **D-3** — retained copy, consistent entity | **done** in the machine-readable layer only, per decision D3 | `lib/seo/schema.ts` |
| **D-4** — duplication discipline | **partly done**: the success-stories strip no longer publishes sixteen anchors; the product carousel is deliberately unchanged — see "Plan corrections" below | `components/layout/success-stories-carousel.tsx` |
| **D-5** — client content | **open**, owned by the client | — |
| **E1** — prune `public/` | **done** — eighteen files removed, two kept because they are seed fixtures | `public/` |
| **E2** — `sizes`, related-tile image | **done** | `components/products/product-carousel.tsx`, `app/(marketing)/products/[product]/page.tsx` |
| **E3** — caching re-verification | **done** — all three public routes still `s-maxage=300`; see "Verification actually run" | — |
| **E4** — hero embed retained | no change, by decision D5 | — |
| **F** — Search Console, Bing, baseline, Render, apex | **not started** — all out-of-repo, see §5.2 | — |
| **G** — guardrails | **done** for A–C: `tests/robots.test.ts`, `tests/sitemap.test.ts`, `tests/seo-dates.test.ts`, `tests/seo-schema.test.ts`, and a new invariant block in `tests/richtext.test.ts` | `tests/` |

### Verification actually run

Measured against a clean production build served locally, not asserted.

| Check | Result |
| --- | --- |
| `npm test` | **253 passed, 0 failed** (was 250 at the start of this work; 5 test files added or extended) |
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm run build` | clean; `/`, `/products`, `/robots.txt`, `/sitemap.xml` static, product pages `● (SSG)`, 5-minute revalidation |
| **E3 caching** | `/`, `/products` and `/products/[slug]` all still `Cache-Control: s-maxage=300` after Packages B and C — the regression this item exists to catch did **not** occur |
| `npm run audit:seo` | **288 checks across 17 routes; 1 warning, 10 failures** |
| The 10 failures | all of them `no og:image`, i.e. the parked decision D4/P1 and nothing else |
| The 1 warning | the soft-404 below |

Structured data on every product page now reads `WebPage, Product, BreadcrumbList`; the homepage
emits `Organization, WebSite, WebPage`; `/products` emits `WebPage, ItemList`. Canonicals resolve to
the configured origin, `robots.txt` advertises the same origin as every canonical, and the sitemap's
`lastmod` comes from the records.

### Plan corrections — where implementing it proved the plan wrong

Recorded rather than quietly fixed, in the style of `docs/DEVELOPMENT-PHASES.md`.

1. **G12 was wrong: two of the twenty files are fixtures, not leftovers.** The plan asserted "none is
   referenced in code". A reference search found `supabase/seed/001_products.sql` pointing at
   `/section-pandora.png` and `/hero-demo.png` as seed `image_url` values. Deleting them would have
   broken the development seed, so both were kept and eighteen files were removed instead. The plan's
   claim came from a search that had not been run against the seed directory.
2. **D-4's product-carousel half is not done, deliberately.** The plan set a stop condition: if the
   duplication could not be removed without regressing the gesture, stop and report rather than
   degrade the carousel. That is what happened. The three copies are load-bearing for the visual
   loop, and the only mechanism available in this workspace for removing them from the markup is
   painting the filler with a data-URI background, which changes how the cards render and cannot be
   visually checked here — there is no browser in this workspace. The proposed change is therefore
   described in §5.3 for a session that can see the result, and the current behaviour is left
   working. Half of D-4 *was* safe: the success-stories strip's duplicates are now decorative rather
   than sixteen `href="#"` anchors, matching the rule `ProductCarousel` already applied to its own
   filler copies.
3. **`robots.ts` gained a `host:` line and then lost it again.** It was added, then removed before
   anything shipped: the plan did not ask for it, the directive is non-standard in `robots.txt`, and
   the origin is already asserted by the `Sitemap:` line, so it was an unrequested addition to a
   crawler-facing file.

### Defects the audit found that the plan did not anticipate

Both were found by *running* the audit rather than by reading the plan, which is the argument for
having built it first.

1. **A soft 404 on the product route.** A slug that does not exist answers **`200 OK`** containing the
   "Product not found" page, and the result is then cached (`x-nextjs-cache: HIT`). Verified on a
   clean production build as a first-ever request, so it is not an artefact of the audit having
   warmed a cache. The page itself is correct — it sets `noindex` — which is the only thing keeping a
   missing page out of an index.
   Two fixes were tried and rejected: raising `notFound()` from `generateMetadata` as well (no effect
   on the status), and `export const dynamicParams = false` (it fixes the status, but it also turns
   any product missing from the build-time manifest into a **hard 404** — on this catalogue that was
   a live product, `smart-parcel-lockers`, which is exactly the "deploy first breaks every product
   read" hazard `CLAUDE.md` already records for the image migration).
   The audit therefore reports it as a warning with `SEO_AUDIT_STRICT_404=1` available to promote it
   to a failure, and the underlying trade — correct status versus on-demand rendering for a
   newly-published slug — is left **open** rather than settled by a guess. See §7 O4.
2. **Two `<main>` and two `<header>` elements on every product page.** `app/(marketing)/products/[product]/loading.tsx`
   wrapped its skeleton in a `<main>` and rendered `<SiteNav>` inside it. React does not discard the
   skeleton when the page arrives — it streams the page into a hidden element and reveals it — so
   both subtrees shipped, and the page carried two `main` landmarks. Duplicate landmarks are an
   accessibility fault ("skip to main content" becomes ambiguous) and they muddy the document
   outline. Fixed by making the loading wrapper a `<div>`, which is what `app/(cms)/cms/loading.tsx`
   already did. Now one `<main>` per page on every route, pinned by `tests/landmarks.test.ts`.

### 5.2 Still to do outside this repository

These cannot be completed from a code change, and none of them is done.

1. Verify `business.qubesmartlockers.com` in Google Search Console and submit `/sitemap.xml`.
2. Repeat in Bing Webmaster Tools.
3. Capture the Core Web Vitals and index-coverage baseline (must be taken before the next deploy to
   be a baseline at all).
4. **G16:** decide whether the Render instance may spin down. A crawler meeting `503 Application
   loading` on an idle instance is an indexing risk; the options are a paid always-on instance or an
   external uptime ping.
5. **G17:** report the dead apex to the domain owner. `https://qubesmartlockers.com/` returns
   Cloudflare `Error 1001` (does not resolve); the fix is an apex → `www` redirect at GoDaddy.
6. Provide OG artwork, or decide against it, to unblock B4/G4/G5.

### 5.3 Follow-ups this work deliberately left open

- **Product-carousel duplication (D-4 remainder).** To be done only in a session with a browser:
  render one authoritative copy of the catalogue in the served markup and paint the loop-seam copies
  with an inline data-URI logo so the visual loop is unchanged. Verify the drag, the snap, the
  reduced-motion path and the hover states afterwards.
- **`acquisition` / `locations` in structured data (O1).** Left out of `productNode` on purpose: the
  client retained the copy, and those fields hold display strings rather than confirmed facts. They
  remain visible on the page, which is where a person or a model reads them.
- **Seed image paths.** `supabase/seed/001_products.sql` still points at `section-pandora.png` and
  `hero-demo.png`. Those are design-reference images being used as product artwork. Replacing them
  with uploaded imagery is a content task, and it is what would let the last two files leave `public/`.

---

## 6. Sequencing and definition of done

```text
A  audit harness ───────────────────────► proves B–E
B  technical foundation ──┬──► C  schema/entity ──► D  GEO content ──► F  measurement
                          └──► E  crawl/CWV (independent of C and D)
G  guardrails  ························ parallel from A onward
```

Landing order: **A → B → C → E → D → F**, with G's tests added per package. Rationale: B and C are
the changes most able to break something silently; E is independent and cheap; D depends on the
entity decisions C forces; F must measure a stable surface.

**Definition of done.**

- `npm run audit:seo` green on every public route, with failures limited to explicitly accepted
  deviations.
- Every public route: one title, one description, one absolute canonical, one `og:image` returning
  `200`, one `h1`, no skipped heading level inside `<main>`.
- `robots.txt` and `sitemap.xml` derive their host from the same resolver as every canonical.
- Sitemap `lastmod` reflects real record timestamps.
- Structured data: `Organization` + `WebSite` + `WebPage` on `/`, `ItemList` on `/products`,
  `Product` + `BreadcrumbList` on detail — all supported by visible content, zero fabricated
  commercial facts, all `@id` joins resolving.
- One brand entity name across JSON-LD and metadata; `sameAs` present and correct; page copy retained.
- `llms.txt` published; no machine-targeted duplicate content added.
- Public routes still `HIT, s-maxage=300`; CMS still absent from JSON-LD, sitemap and the index.
- `typecheck`, `lint`, `test` and the production build green, including the new guardrail tests.
- Search Console and Bing verified, sitemap submitted, baseline recorded.

---

## 7. Decision register

### Locked

| # | Decision | Consequence |
| --- | --- | --- |
| **D1** | Legal entity: **QUBE Smart Technology Corp.** | `Organization.legalName`; the public brand stays `QUBE Smart Lockers` |
| **D2** | `sameAs`: LinkedIn, Facebook, `https://www.qubesmartlockers.com/` — emitted as given, absolute, with no invented paths. The `www` form is the **verified-reachable** host (§4). | C3 |
| **D3** | Existing public copy and link text are **retained**. The client is the source of truth for wording, including "QUBE Smart Solution Expert". | Packages A7/B7 withdrawn; no copy edits; G6 is fixed in the machine-readable layer only |
| **D4** | Machine-readable naming: `name` = `QUBE Smart Lockers`; `legalName` = `QUBE Smart Technology Corp.`; `alternateName` = `["QUBE", "QUBE Smart Technology"]`; `Product.brand.name` = `QUBE Smart Lockers`. **No page text changes.** | C1 |
| **D5** | The hero YouTube video is **retained** as-is for now. | Package E1 withdrawn; G14 recorded as accepted cost |
| **D6** | Measurement = in-repo work + Search Console/Bing setup + a before/after baseline. **No analytics script.** | Package F scope fixed |

### Parked

| # | Item | Owner | Unblocked by |
| --- | --- | --- | --- |
| **P1** | **Open Graph image fallback (G4/G5, B4).** No `og:image` exists on `/`, `/products`, or any product without a hero image — content shares are bare text cards. Options: (a) client supplies 1200×630 artwork; (b) an explicit decision to ship a typographic fallback built from the existing logo; (c) accept bare cards and drop the item. **Generating brand artwork unasked would be inventing design.** Tracked on the board as card `k5`. | Client | Client artwork or an explicit choice |

### Open

| # | Item | Blocked on |
| --- | --- | --- |
| **O1** | `additionalProperty` for `acquisition`/`locations` (C6) | Confirmation that these CMS fields hold stable product facts rather than marketing copy |
| **O2** | `contactPoint` on `Organization` (C3) | A real public phone or email, if one should be published |
| **O3** | Removing `/cms/login` from the public footer (B6/G15) | **Decided by the client: remove it, everywhere in the public chrome.** Implemented; the CMS is reachable by URL only, which is cosmetic rather than protective — approval and RLS remain the gate |
| **O4** | **The soft-404 trade.** An unknown product slug answers `200`. Fixing the status with `dynamicParams = false` makes any product absent from the build-time manifest a hard 404, which on this catalogue hit a live product. The alternatives are: accept `noindex` as the protection and leave on-demand rendering intact (**current state**); or accept the hard-404 risk for a status crawlers understand. Reportable, but the decision is not ours to make silently. | A deliberate choice between status correctness and a new-product outage risk |

---

## 8. Evidence, and what is still owed

Item 5 of this list was satisfied during implementation, unusually early: §5.1's "Plan corrections"
records three places where the plan was wrong — two of the twenty `public/` files being seed
fixtures, the product-carousel half of D-4 being left undone on purpose, and a `host:` directive
added to `robots.ts` and withdrawn again before it shipped. §5.1 also records the two defects the
audit found that the plan had not anticipated. They are kept visible rather than quietly amended, in
the style of `docs/DEVELOPMENT-PHASES.md`.

**Done and measured:** the test suite (253 passing), typecheck, lint, the production build, the
caching re-check, and a full `audit:seo` run — see "Verification actually run" in §5.1.

**Still owed, and not claimed anywhere in this document:**

1. **The `audit:seo` baseline was never captured before the changes.** The script exists and its
   output is now recorded, but it was written *during* this work, so there is no "before" column for
   the routes it was built to prove. The findings it reports are current-state, not a delta. A
   genuine before/after needs a deployed baseline, and the next deploy is the earliest it can exist.
2. **A structured-data inventory** — route → nodes emitted → the visible content supporting each.
   The builders, their tests and the per-route node lists now exist; the inventory table does not.
3. **The Core Web Vitals capture and the index-coverage capture** from Package F, none of which has
   been taken. Field data cannot be produced from this workspace at all.
4. **The console setup** — Search Console, Bing, sitemap submission — and the two host items
   (G16 Render spin-down, G17 dead apex) in §5.2. All out-of-repo.
5. **The OG image decision** (§7 P1), which is the only reason the audit is red. Ten of its 288
   checks fail on it; every other check passes.

Any decision in §7 that changes during implementation is recorded here rather than silently applied,
consistent with the project rule against inventing requirements.
