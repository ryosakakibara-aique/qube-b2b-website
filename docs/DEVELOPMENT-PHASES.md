# Development Phases — Evidence-Based Plan

This is the working plan for turning the current repository into the product described by
[CLAUDE.md](../CLAUDE.md), the design docs, and the confirmed Figma nodes.

It deliberately replaces the generic phase list in CLAUDE.md → *Implementation Order* with a
version targeted at **what this repository actually contains today**, verified by reading the
code. CLAUDE.md's five phases remain the spine; each phase below adds the verified entry state,
exact file targets, a verification command, and an exit gate.

**Baseline verified on:** working tree at commit `3f69dce` plus the uncommitted changes listed in
Appendix B (`git status`: `CLAUDE.md`, `DESIGN_SYSTEM.md` modified; `AGENTS.md`, `ARCHITECTURE.md`
deleted; `FIGMA.md`, `docs/` untracked).

---

## 0. How to use this document (anti-hallucination rules)

Every task in this plan must satisfy these rules. They exist because this project's failure mode is
**confident invention** — plausible-looking colors, roles, routes, and APIs that exist in no
requirement and in no Figma frame.

### 0.1 Evidence hierarchy

When a value, name, or behavior is needed, take it from the highest available source:

1. **Figma frame** (source of truth for anything visual) — reached via `docs/design/` exports.
2. **`docs/design/design-*.json`** — machine-readable geometry/palette extracted from those exports.
3. **Repository documentation** that describes *this* project (`CLAUDE.md`, `DESIGN_SYSTEM.md`,
   `DEFINITION_OF_DONE.md`, `docs/design/*`).
4. **Existing code** in this repo. Preserve it unless a change is required.
5. **`node_modules/next/dist/docs/`** — the authoritative Next.js 16.3.4 reference bundled with the
   installed version. Next 16 differs from older training data (e.g. `proxy.ts` replaces
   `middleware.ts`).
6. Nothing else. Not memory of other projects, not "typical" SaaS patterns.

### 0.2 Hard prohibitions

- **Do not invent design values.** A hex literal is legitimate only if it appears in
  `docs/design/DESIGN-REFERENCE.md` §2 or in `design-measurements.json`. The current code contains
  four design-absent colors (11× `#10b9b8`, 3× `#0e8e8f`, 18× `#dbe3ec`, 2× `#ffffff` on dark).
  Treat every one as a defect, not a token.
- **Do not invent screens.** The confirmed scope is 7 routes. `/cms` exists as an undocumented
  redirect.
- **Do not invent data model.** Prisma-era docs (`DATABASE.md`, `STRUCTURE.md`) describe `Page`,
  `Media`, `AuditLog`, `prisma/schema.prisma`. CLAUDE.md forbids Prisma and says not to implement
  unrelated entities. Those files are stale (Appendix B) — they are **not** a spec.
- **Do not invent roles, statuses, or workflows.** See decision **D1** — `BUSINESS_RULES.md` and
  CLAUDE.md conflict on exactly this, and **no role or status code exists anywhere in the repo**.
- **Do not invent copy.** Placeholder text in the codebase (`Lorem ipsum`, `SECTION 1`, `Link 1–4`,
  `Content 1`, invented marketing paragraphs) must be replaced by real copy sourced from Figma
  exports or the client — never by newly authored filler.
- **Do not invent Supabase objects.** No table, bucket, policy, or column may be added without a
  requirement naming it.
- **State confidence.** When a task cannot be grounded, it becomes a decision request (Section 1),
  not an implementation.

### 0.3 Per-task definition of "grounded"

A task is ready to implement only when the implementer can name, in the task record: the Figma node
(if visual), the design value source (if a token), and the requirement line (if behavior). If any is
missing, stop and raise it.

---

## 1. Open decisions — resolve before the phase that needs them

These were genuine ambiguities in the repository, not gaps in diligence. Each materially affects
architecture, data, security, or user flow, so CLAUDE.md §"Do not silently invent requirements"
required them to be identified rather than guessed.

**Status: every decision is now closed except D2 and D3.** D1, D4, D5, D6, D7, D8 and D9 were
resolved by client decision or engineering judgement (see §1.1); D2 and D3 still need a Figma
re-export before typography and the mobile frames can be verified.

| ID | Question | Blocks | Why it cannot be inferred |
| --- | --- | --- | --- |
| **D1** | **Roles + content workflow.** CLAUDE.md says `admin` / `editor` / `viewer`. `BUSINESS_RULES.md` says `CONTENT_EDITOR` / `CONTENT_MANAGER` / `ADMIN`, plus a Draft→Review→Published workflow, soft delete, audit log, and restore. Which governs? | Phase 1 (RLS), Phase 3 (list/form) | Two project documents disagree; zero role or status code exists in the repo; the CMS list screen has a toggle whose meaning is unverified. |
| **D2** | **Typography.** Font family, size, weight, leading, tracking are absent from every SVG export (text was outline-converted). `app/layout.tsx` loads Inter — unverifiable against the design. | Phase 1 (tokens), Phase 2, Phase 5 (visual QA) | Requires a re-export from Figma with "Outline Text" disabled, or PNG at 1x/2x. Not derivable from the repo. |
| **D3** | **`docs/design/screenshots/`.** `docs/design/README.md` and `DESIGN-REFERENCE.md` both link to it and describe 10 SVG exports; the directory **does not exist** on disk. Are the exports gone, untracked elsewhere, or never committed? | Phase 5 (visual QA) | Documented artifact is missing; the extracted JSON may or may not be sufficient as a substitute. |
| **D4** | **shadcn/ui.** CLAUDE.md and DESIGN_SYSTEM.md list shadcn/ui as the primitive layer. It is **not installed** (`components.json` absent, no Radix/`class-variance-authority` dependency). Add it, or record the decision to stay on hand-rolled primitives? | Phase 1 (primitives), Phase 3 (dialogs/tables) | Listing a stack item is not the same as a requirement to install it; adding a dependency needs justification per CLAUDE.md. |
| **D5** | **Media storage.** CLAUDE.md mandates Supabase Storage for CMS uploads. No upload code, bucket, or `storage` reference exists. The form's "Browse" buttons and image placeholders are inert. Bucket name, allowed types, size cap, and public/private policy are all unstated. | Phase 3 (product image), Phase 4 (rendering) | No requirement names the bucket or rules. |
| **D6** | **Production hostname.** `product-form.tsx` hardcodes the path prefix `business.qubesmartlockers.com/`; `sitemap.ts`/`robots.ts`/detail metadata fall back to `http://localhost:3000` via `NEXT_PUBLIC_SITE_URL`. The real canonical origin is unconfirmed. | Phase 4 (canonical/OG/sitemap/JSON-LD) | Canonical URLs and structured data must not be fabricated; wrong origin poisons SEO. |
| **D7** | **Environment + deployment.** No `.env.example` exists, and `.gitignore`'s `.env*` pattern would also ignore one. Is there a Supabase project, and which Vercel project/domain? | Phase 1 (Supabase), Phase 5 | Cannot create or document credentials that were never provided. |
| **D8** | **Contact form destination.** Three identical "Talk to a QUBE Smart Solution Expert" forms render with no `action`, no handler, and no field `name` attributes — submitting performs a default GET navigation. Where should leads go (Supabase table, email, CRM, external integration)? | Phase 2/4 | CLAUDE.md restricts Route Handlers to real contracts and forbids inventing entities; the destination is a business decision. |
| **D9** | **Motion.** The design specifies no animation anywhere — no durations, easings or transitions exist in any frame — and the client asked for scroll animations across the user-facing pages. Which system, how much of it, and does adding motion override "do not redesign the Figma UI"? | Phase 5 (public pages) | Every value in a motion system would be invented rather than read from the design, so this is a client decision, not an inference. It also adds a dependency, which CLAUDE.md requires to be justified against the existing stack. |

---

## 1.1 Resolution status

| ID | Outcome |
| --- | --- |
| **D1** | **Resolved by client decision — hybrid.** CLAUDE.md's `admin` / `editor` / `viewer` govern; publication is a single `published` boolean toggled from the CMS list; the public site reads published rows only. Draft→Review→Published, audit log and soft delete are deferred, and no delete affordance is exposed, so nothing is destroyed from the UI. Implemented in `supabase/migrations/002_*.sql`. |
| **D2** | **Still open — needs a Figma re-export.** Nothing in the repository can resolve typography against the design. [TYPOGRAPHY.md](../TYPOGRAPHY.md) now documents the scale actually implemented, which is derived from code and explicitly not a Figma verification; no type tokens were invented. |
| **D3** | **Still open.** `docs/design/screenshots/` is absent. The extracted palette/geometry JSON was sufficient for colour and shape work; typography and copy are not recoverable this way. |
| **D4** | **Resolved by engineering judgement — do not install shadcn/ui yet.** CLAUDE.md mandates a small dependency footprint, and V1 needs no dialog, popover, sheet or tab. The one table is native `<table>`; the switch is a native button with `role="switch"`. Revisit when a real primitive is required. |
| **D5** | **Resolved by client decision — build the upload.** Bucket `product-images`, public read, `admin`/`editor` write, PNG/JPEG/WebP, signature-verified, **5 MB cap** with `experimental.serverActions.bodySizeLimit` raised to 6 MB in `next.config.ts` so the cap is reachable (Round 16–17: at Next's 1 MiB default a larger image was refused before validation and the form hung). A square of around 2000 px is the recommended upload. SVG refused on purpose. |
| **D6** | **Resolved.** The site is hosted on Render at `business.qubesmartlockers.com`. That origin is the documented value for `NEXT_PUBLIC_SITE_URL` and is pre-filled in `render.yaml`; a production build missing the variable now falls back to the production origin rather than localhost, with a warning. The CMS form's hardcoded `business.qubesmartlockers.com/` path prefix is therefore confirmed correct rather than assumed. |
| **D7** | **Resolved.** The client created the Supabase project, applied both migrations, added an approved user and published a product, so the application now runs against real data. The authenticated write path is exercised through the CMS UI rather than the API here, because no service-role credential exists in this workspace by design. |
| **D8** | **Resolved by client decision — capture enquiries.** `public.contact_submissions` with anonymous insert and admin-only read, submitted through a validated server action with a honeypot. No CRM or e-mail integration. Live-verified: an anonymous insert returns 201, and an anonymous read returns zero rows. |
| **D9** | **Resolved by client decision — Motion on the marketing routes only, reveals and micro-interactions only, no new visual design.** `motion` 13 through `LazyMotion` + `m` + `strict`, with a single provider in a new `app/(marketing)/layout.tsx` so `/cms/*` pays nothing; numbers live in `components/motion/tokens.ts` and are mirrored into `globals.css` for the two CSS micro-interactions. The above-the-fold elements fade in as a cascade, heading first, as the client then asked for (see the Round 14 follow-up): this **knowingly gives up the pure-LCP position recorded earlier**, because the heading is the largest contentful paint element on `/` and `/products` and text at `opacity: 0` is not a valid LCP candidate, so the metric now lands when its fade ends rather than at first paint. The heading therefore takes the shortest duration in the system (260ms) and no delay at all, which is structural: `heroHeading()` accepts no index, so it cannot be staggered even by mistake. Route changes fade in from the second navigation onward and never on a hard load; the mobile navigation panel is the one overlay that animates its exit; hover and press feedback stay in CSS so no runtime is involved. Ambient lighting, particles, rotating decoration, pointer tracking and parallax were **excluded** — they are new visual design, which §24 of the brief and CLAUDE.md's "do not redesign the Figma UI" both forbid. Measured cost: the motion runtime is **32.4 KB gzipped** of vendor JavaScript on every marketing page (three chunks), against the ~20 KB the library's own documentation predicts, because Turbopack tree-shakes less aggressively than the Rollup figures it publishes. That is the price of D9. `MOTION_ENABLED` switches every animation off at runtime, but it cannot remove the bytes — a runtime constant cannot remove an import, so the chunks still load; reclaiming them means reverting the dependency. |

### Deliberate deviations from the documentation

1. **Content sections are data-driven, not fixed at three.** The Figma create screen shows three
   content blocks, but the designed product pages render more (PANDORA has five), and the write path
   replaces every section it is given. A fixed count would silently delete authored content on save.
   The CMS therefore manages a variable count, starting at three, with add/remove controls that do
   not appear in the frame.
2. **The public footer renders known navigation targets** rather than the frame's placeholder link
   text, which cannot be read from the reference pack.
3. **`components/products/` and `components/seo/`** exist alongside the documented component groups,
   and `lib/` is split by domain rather than into a generic `lib/services/`. Recorded in
   [STRUCTURE.md](../STRUCTURE.md) → Deliberate deviations.
4. **The public pages now contain motion the design does not specify** (D9). "Do not redesign the
   Figma UI" is preserved in the sense that nothing moves, changes colour, changes type or changes
   layout at rest — but a scroll animation is still an addition to a design that had none, so it is
   recorded here rather than presented as fidelity. The whole system is reversible from one value.
5. **Every content block takes two images, not one.** The create/edit frames give two slots to the
   first block and one to each of the others; that is how it was built. The client asked for a second
   image on the other blocks too, including blocks added in the CMS, so the per-position rule was
   removed (`SECTION_IMAGE_SLOTS`). No schema or write-path change was needed: the images table is
   keyed by section and sort order and `save_product_content()` walks however many it is given. The
   detail page already lays two images out side by side.

---

## 2. Verified baseline (what is actually built)

### 2.1 Toolchain — confirmed

| Fact | Evidence |
| --- | --- |
| Next.js `16.3.4`, React `19.2.8`, TypeScript 5, Tailwind CSS 4 via `@tailwindcss/postcss` | `package.json` |
| Supabase clients: `@supabase/supabase-js` `^2.116.0`, `@supabase/ssr` `^0.12.7` | `package.json` |
| **No Prisma, no zod, no shadcn/ui, no Radix, no test runner, no CI** | `package.json`, no `components.json` |
| Scripts are only `dev`, `build`, `start`, `lint` — there is **no `typecheck` script** | `package.json` |
| `npx tsc --noEmit` → **exit 0** (types clean) | verified run |
| `npm run lint` → **exit 1**: 1 error + 3 warnings | verified run |
| Lint error: `useMemo` called after the early `return` at line 119 (`react-hooks/rules-of-hooks`) | `components/products/product-carousel.tsx:119,127` |
| Lint warnings: unused `storyNames` ×2, unused `ProductCoverflow` import | `app/page.tsx:50`, `app/products/page.tsx:5,10` |
| Next 16 uses `proxy.ts`, export named `proxy` — **not** `middleware.ts` | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:23,32,58` |

### 2.2 Routes — confirmed complete, one undocumented

All 7 declared routes exist and no others, except `/cms` (a redirect to `/cms/products`).
Route groups in use are `(auth)` and `(cms)`; the three public routes sit at the `app/` root with
**no `(marketing)` group**, which differs from CLAUDE.md → Route groups. See Appendix B.

### 2.3 Feature completeness — confirmed partial

| Area | Verified state |
| --- | --- |
| **Auth** | `signIn` server action only. **No `signOut` exists anywhere** (grep). Login page is a client component with `admin@qubesmart360.com` prefilled as a default value. |
| **Authorization** | `proxy.ts:25` checks *authentication only* and redirects. **No role check exists in any file.** |
| **RLS** | `supabase/migrations/001_products.sql:32-33` grants `authenticated` full write with `using (true) with check (true)` — every signed-in user can write everything. |
| **Public reads** | `lib/products/queries.ts:49,61` use the **cookie-based** server client, and `lib/supabase/server.ts:5` awaits `cookies()`. |
| **Data fallback** | `queries.ts:50,56,63,70` silently return `mockProducts` when env vars are missing **or on any Supabase error**. 7 mock products exist in code vs 4 rows in `supabase/seed/001_mock_products.sql`. |
| **Product persistence** | `actions.ts:79-84` writes only the `products` row. In the Supabase path, `product_content_sections` are **never written** — the form's Content 1–3 fields are silently discarded. Content-image alt inputs are never read. `imageUrl` is never read from the form (no such field exists). |
| **Cache invalidation** | No `revalidatePath`/`revalidateTag` call anywhere after save. |
| **CMS list** | `app/(cms)/cms/products/page.tsx:5` hard-slices to 4 rows; `:37` renders literal `Lorem ipsum dolor sit amet...`; `:42` renders non-functional toggle spans; `:71-87` renders hardcoded pagination with page 2 permanently active. No delete, duplicate, search, or sort. |
| **CMS create** | `app/(cms)/cms/create/page.tsx:12` heading reads "Edit Product Content" on the create screen. |
| **CMS edit** | `app/(cms)/cms/edit/[product]/page.tsx:23` renders a hardcoded timestamp `9/13/2025, 4:22 PM` instead of the row's `updated_at`. |
| **Media** | No Supabase Storage usage anywhere. "Browse" buttons do nothing. Image slots are empty `<div>`s with `aria-label`. Product images are `null` or `/public` paths. |
| **Navigation** | `SiteNav` exposes only `#features`, `/products`, `/cms/login`, `#contact`. |
| **Footers** | All three public pages repeat a placeholder footer (`SECTION 1/2/3`, `Link 1–4`) built from `<p>`+`<br>` — **no `<a>` elements**, so it is a fake nav: not crawlable, not keyboard-navigable. |
| **Contact forms** | Three copies; inert (see D8). Inputs have `aria-label` but no `name` and no `<form>` action. |
| **JSON-LD** | **None.** Grep for `application/ld+json` returns zero matches, despite CLAUDE.md listing Organization/WebSite/WebPage/Product/Service/BreadcrumbList. |
| **Metadata** | Global title/description in `app/layout.tsx:10-13`. Only `/products/[product]` defines `generateMetadata` (canonical + OpenGraph). `/` and `/products` inherit the global pair. |
| **Sitemap** | `app/sitemap.ts` lists **only** `/` and `/products` — product detail URLs are missing; it is a synchronous function that never queries products. |
| **Robots** | `app/robots.ts` disallows `/cms/`. Consistent with scope. |
| **404** | `app/not-found.tsx` exists and is styled; no custom `/cms`-scoped not-found. |

### 2.4 Design conformance — confirmed drift

Verified first-hand by counting hex literals in `app/`, `components/`, `lib/`:

| Value | In code | In design | Verdict |
| --- | --- | --- | --- |
| `#10b9b8` | 11 | absent | **invented** — used for primary CTAs; the design fills them with the brand gradient |
| `#0e8e8f` | 3 | absent | **invented** — nearest design value is `#0F766E` |
| `#dbe3ec` | 18 | absent | **invented** — nearest are `#CBD5E1` / `#E5E7EB` |
| gradient stops `#00c290`,`#0fb8aa`,`#1fadc5` | 10 / 9 / 9 | present | **correct** — partial adoption only |

The correct gradient is already in the codebase (`components/layout/product-coverflow.tsx:85` and the
carousel/parallax/success-story components), while every `Talk to an Expert` CTA uses the invented
solid. This is a consistency defect, not an unknown.

> Historical note: this section records the audit of the tree at commit `3f69dce`.
> `product-coverflow.tsx` was an unused second implementation of the product showcase and has since
> been deleted, so the surviving gradient implementations are the carousel, parallax and
> success-story components plus the `--brand-gradient` token.

Affected files: `components/layout/site-nav.tsx:50`, `components/ui/Button.tsx:7`,
`app/page.tsx:69,121,183`, `app/products/page.tsx:31,96`, `app/products/[product]/page.tsx:136,194,257`,
`app/globals.css:52`.

### 2.5 Architecture inference (reasoned, flagged as inference)

Because public queries reach the **cookie-based** client, every public page awaits `cookies()`, which
opts it into per-request dynamic rendering. CLAUDE.md asks for server-rendered public content,
efficient queries, and appropriate caching. This means the public marketing pages currently cannot be
statically cached at all. **This is an inference from verified code, not a measured build output** —
Phase 5 must confirm it with a real build (`npm run build` route table) before acting.

---

## 3. Phase 0 — Truth baseline and document reconciliation

**Goal:** make the repository's own instructions consistent and trustworthy before building on them.
Every later phase reads these documents as spec, so drift here becomes hallucination later.

### Work items

1. **Land or discard the working tree.** `CLAUDE.md` and `DESIGN_SYSTEM.md` are modified;
   `AGENTS.md` and `ARCHITECTURE.md` are deleted; `FIGMA.md` and `docs/` are untracked. Commit in
   focused commits or revert. Do not stack new feature work on an uncommitted doc rewrite.
2. **Quarantine the stale Prisma-era docs.** `STRUCTURE.md` (references `prisma/schema.prisma`,
   `app/(website)`, `lib/db`, `tests/`) and `DATABASE.md` (`User`/`Page`/`Media`/`AuditLog`) both
   contradict CLAUDE.md's explicit constraints. Either delete them, or rewrite each to match the
   verified state. Do **not** leave them as apparent spec.
3. **Resolve D1** (roles + workflow) and record the answer in one canonical place — CLAUDE.md is
   the natural home. `BUSINESS_RULES.md` must then either match or be explicitly marked as
   out-of-scope.
4. **Create `.env.example`** documenting exactly the three variables the code reads:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
   Note that a service-role key is **not** referenced anywhere yet — do not add one speculatively.
   Then fix `.gitignore`: `.env*` currently ignores `.env.example` too; add `!.env.example`.
5. **Close the design-reference gap (D2, D3).** Either add the re-exported frames (SVG with live
   text, preferred) under `docs/design/screenshots/`, or correct the docs that claim that directory
   exists. Reconcile root-level `figma-landing.png` / `figma-landing-current.png` against
   `docs/design/README.md`'s naming convention.
6. **Fix `FIGMA.md` lines 7–8** — both read `Products/[Product]` with no variant, but `13:2821` is
   the mobile frame (a second mobile node beyond the three already noted).
7. **Fix the lint error** `components/products/product-carousel.tsx:119-137` by moving the `useMemo`
   above the `n === 0` early return. Remove the three unused-symbol warnings. This is a real
   correctness bug (hook order), not style.
8. **Add a `typecheck` script** (`tsc --noEmit`) so DoD's "TypeScript passes" is executable.

### Verification

```bash
git status                      # clean, or intentionally staged
npm run lint                    # exit 0
npx tsc --noEmit                # exit 0
grep -n "prisma" STRUCTURE.md DATABASE.md   # gone or explicitly marked stale
```

### Exit gate

Docs agree with each other and with the code; D1, D2, D3 are answered or explicitly deferred with an
owner; lint and typecheck are green; `.env.example` exists and is tracked.

---

## 4. Phase 1 — Foundation

**Goal:** one token layer derived from the design, a Supabase boundary that separates public reads
from CMS writes, and an authorization model that actually enforces D1.

### Work items

1. **Token layer.** Populate `app/globals.css` `:root` from `DESIGN-REFERENCE.md` §2 only. Replace
   the current semantic set, which maps `--accent` to `#3f3f46` (the CMS neutral) and ignores
   `#27272A` — the single most-used color in the design. Introduce the brand gradient as a token,
   since it is used in at least four places. Delete `#10b9b8`, `#0e8e8f`, `#dbe3ec` from the
   codebase and `app/globals.css:52`.
2. **Typography** — blocked by D2. Do not change the Inter choice until the type specs exist.
   Record the current font as unverified rather than correct.
3. **Supabase client split.** Keep the cookie-based client for the CMS. Add a **cookie-free** client
   for public reads so marketing pages can be statically rendered and cached (see §2.5). Public
   queries must never await `cookies()`.
4. **Kill the silent mock fallback.** `lib/products/queries.ts` must stop pretending a failed query
   is data. Move `mock-data.ts` out of the runtime path (seed-only), and surface failure as an error
   state. Distinguishing "empty database" from "misconfigured" is a prerequisite for trustworthy QA.
5. **Authorization.** Implement D1's roles server-side and in RLS, replacing the blanket
   `using (true) with check (true)` policies. Client-side role checks are UX only. Ensure the
   anonymous role can read only published/public product data.
6. **Shared primitives.** Decide D4. Until then, extend only what exists (`components/ui/Button.tsx`)
   and do not hand-roll a component library in parallel with a planned shadcn adoption.
7. **Storage** — blocked by D5. Do not create buckets speculatively.

### Verification

- Every hex literal in the tree is traceable to `DESIGN-REFERENCE.md` §2 (enumerate with a grep for
  `#[0-9a-fA-F]{6}` and diff against the palette).
- `npm run build` route table inspected to confirm which public routes are static vs dynamic.
- RLS: sign in as a non-privileged role and confirm a write is rejected by the database, not just by
  the UI.

### Exit gate

Tokens are design-derived and drift-free; public reads no longer depend on cookies; mock data is no
longer served as real content; RLS matches D1; typecheck and lint green.

---

## 5. Phase 2 — Shells

**Goal:** the marketing and CMS framing the confirmed screens sit inside, including the parts
currently faked.

### Work items

1. **Marketing shell.** Factor the 3×-duplicated footer out of `app/page.tsx:215`,
   `app/products/page.tsx:129`, `app/products/[product]/page.tsx:311` into one component, and give it
   **real anchors**. `SECTION 1/2/3` / `Link 1–4` is placeholder structure with no `<a>` elements —
   it is not crawlable and not keyboard accessible, which breaks DoD's SEO and accessibility items.
   Real link targets must come from Figma/`FIGMA.md`, not from invention.
2. **Contact form contract.** Resolve D8, then implement a single reusable form with real `name`
   attributes, labels, validation, and a success/error state. Currently three inert copies exist.
3. **CMS App Shell.** The implemented shell (`components/cms/cms-shell.tsx`) is a topbar + centered
   `max-w-[1040px]` main. CLAUDE.md permits a sidebar; the Figma CMS frames show a topbar. **Keep
   the topbar** — CLAUDE.md's shell list is "may contain", not "must". Do not add a sidebar.
4. **Shell/business separation.** Confirm the shell carries no product logic (it currently does not —
   keep it that way as sign-out, breadcrumbs, and session display are added).
5. **Responsive behavior.** Figma defines explicit mobile frames: `1:556` (`/`), `8:1602`
   (`/products`), `13:2821` (`/products/[product]`). None of the four CMS frames has a mobile
   variant, so CMS responsive work must be validated as sensible degradation, **not** as
   Figma-fidelity. State that distinction in the QA record rather than claiming a match.

### Exit gate

Footer and contact form exist once each, are semantic, and are keyboard-operable; no shell contains
product logic; responsive work is verified against the three named mobile nodes and labelled
correctly for the CMS.

---

## 6. Phase 3 — CMS vertical slice

**Goal:** the four CMS screens behave like a real editor, not a rendering of the Figma frame.

### Work items

1. **Login** (`1:2265`). Remove the prefilled `admin@qubesmart360.com` default. Add sign-out (no such
   action or control exists today) and surface the real signed-in identity instead of the hardcoded
   "Admin" label in `components/layout/site-nav.tsx:29`. Define what happens for an authenticated
   user lacking the required role.
2. **Product listing** (`1:2316`). Delete `Lorem ipsum`. Decide what the toggle means under D1
   (publish state or nothing) and either wire it to a real column or remove it. Replace the fake
   pagination (`:71-87`) and the `slice(0, 4)` cap with real query-driven paging, or remove the
   controls until paging is required. The Figma list shows 4 columns (Title, Path, Description,
   Actions) — do not add columns the design does not have.
3. **Create** (`1:2372`). Fix the "Edit Product Content" heading. Keep the field set exactly as
   Figma defines it: Title, Description, Tags, Product Image + alt, Acquisition, Locations, CTA,
   Path/slug, and Content 1–3 (heading, body, images + alts), with the long/short content limits
   (3,000 / 1,000) enforced.
4. **Edit** (`1:2525`). Render real `updated_at` instead of the hardcoded `9/13/2025, 4:22 PM`.
5. **Persistence correctness — the highest-value fix in this phase.**
   `lib/products/actions.ts` must write `product_content_sections` (create/update/reorder/delete),
   read the content-image alt fields the form already renders, and handle the product image once D5
   is answered. Today, saving from the CMS discards everything below the product row.
6. **Validation and identity.** Validate on the server (slug format/uniqueness, required fields,
   length limits) — note that no validation library exists, and CLAUDE.md requires justifying new
   dependencies; a schema validator may be the one dependency worth adding, decided explicitly.
   Return field-level errors to the form.
7. **Cache invalidation.** Call `revalidatePath` for the affected public routes after a successful
   save, so edits are visible without a redeploy.
8. **Feedback and safety.** Success confirmation, loading/disabled states, and a confirmation step
   for destructive actions per DoD. Note that the Figma frames do **not** define a delete
   affordance — under D1's soft-delete answer, decide whether delete is in scope at all rather than
   inventing a UI for it.
9. **Accessibility.** The listing is a real `<table>` (good). The toggle is a decorated `<span>`
   pair with no role, label, or keyboard access — it must become a real control or be removed.

### Exit gate

Create → edit → list round-trips through Supabase with content sections intact; a misconfigured
environment produces a visible error, not mock rows; each screen's states (loading, empty, error,
success) exist; role enforcement is server-side.

---

## 7. Phase 4 — Public website

**Goal:** the three public routes are accurate, crawlable, fast, and design-faithful.

### Work items

1. **Design conformance.** Replace every invented color with the design value or the brand gradient
   (§2.4). Verify against `design-measurements.json` geometry for section heights and container
   widths (the `max-w-[1040px]` container is consistent across pages today).
2. **Replace placeholder content.** The footers, the generic "Multi-service platform" copy, the
   duplicated "Real-time data tracking / Online configuration / App connection / Customizability"
   tile block, and the hardcoded `pandoraContent` map inside
   `app/products/[product]/page.tsx:17-53` all need real, product-specific content. The
   `pandoraContent` special case is a genuine structural smell: one slug gets hardcoded copy while
   every other product gets generated fallback text (`:50-52`). Move that content into the data
   model or the CMS, not an `if (slug === "pandora")`.
3. **Images.** Product images are empty `<div>`s. Once D5 is answered, render real optimized images
   with the alt text the CMS collects. Use `next/image` — already used for logos.
4. **Metadata.** Add per-page titles, descriptions, canonical URLs, and Open Graph to `/` and
   `/products` (today only the detail route has them). Do not guess the origin — D6.
5. **Sitemap.** Extend `app/sitemap.ts` to include every product detail URL, sourced from
   `getProducts()` (it must become async). Leave the CMS out of the sitemap.
6. **Structured data.** Add JSON-LD only where the page content supports it, per CLAUDE.md:
   `Organization` + `WebSite` on `/`, `Product` on the detail route (only the fields actually
   present), `BreadcrumbList` where breadcrumbs exist. **No fabricated ratings, prices, or reviews.**
   No `Service` unless a real service page exists — it does not today.
7. **Semantic HTML.** Public pages are `<main>` + `<section>` + headings, which is largely correct.
   Fix heading hierarchy where the marketing blocks jump levels, and convert the fake footers to
   real `<nav>`/`<ul>`/`<a>` structures.
8. **Internal linking.** `SiteNav` links only to `#features`, `/products`, `/cms/login`, `#contact`.
   Product-to-product links exist via related products. Ensure navigation exposes the real site
   structure once footer links are real.
9. **`/cms` redirect.** Either document it or remove it — it is currently an undocumented route.

### Exit gate

Zero design-absent hex values; no placeholder copy anywhere on public routes; every route has its own
metadata and canonical; sitemap enumerates all public URLs; JSON-LD is limited to supported facts;
public pages are statically renderable.

---

## 8. Phase 5 — QA

**Goal:** prove the DoD — not assert it. Each area below lists the state that makes it verifiable,
because most of these are currently unverifiable rather than merely unverified.

| Area | Current state | What Phase 5 needs |
| --- | --- | --- |
| Functional | Partly testable; a failed save silently drops content (Phase 3 fixes this) | Round-trip test for create/edit; error paths for auth and save |
| Visual | **Blocked (D2/D3)** — no typography source; `docs/design/screenshots/` missing | Re-exported frames (live-text SVG preferred, PNG 1x/2x acceptable) |
| Responsive | 3 mobile nodes exist; CMS has none | Verify the 3 named nodes; label CMS behavior as degradation, not fidelity |
| Accessibility | Real `<table>`; but fake toggle, fake footer nav, unlabeled-vs-labelled inputs mixed | Keyboard pass, focus visibility, contrast against the verified palette, form labels |
| Security | Auth-only proxy; RLS grants all writes to any authenticated user | Confirm D1 enforcement in RLS; verify no secret reaches the client; check env handling |
| SEO | Sitemap incomplete; no JSON-LD; partial metadata | Re-verify each SEO item in CLAUDE.md explicitly |
| AI/LLM discoverability | Semantic structure partly exists; placeholder copy actively harms it | Confirm self-contained sections, consistent entity naming, stable canonicals |
| Performance | Public pages likely dynamic via `cookies()` (§2.5) | Confirm with `npm run build`; then fix and re-measure |
| Engineering | Lint currently fails; no tests; no CI | Lint + typecheck green and enforced; test approach decided (DoD claims tests exist) |

**Visual QA is continuous** (CLAUDE.md, DESIGN_SYSTEM.md) — run the
Figma → Implement → Compare → Correct → Approve loop per component, not once at the end. Phase 5
consolidates and re-verifies; it does not start the comparison.

---

## 9. Phase status snapshot

| Phase | Status |
| --- | --- |
| 0 — Truth baseline | **Done** — lint and typecheck green, `typecheck` script added, `.env.example` tracked, `.gitignore` negated, `FIGMA.md` mobile label fixed, stale Prisma-era docs rewritten, V1 decisions recorded in CLAUDE.md. |
| 1 — Foundation | **Done except typography (D2)** — tokens derived from the extracted palette, every invented hex removed, cookie-free public client added, silent mock fallback deleted, roles + RLS implemented, Storage and lead capture implemented. Visual QA remains blocked on D2/D3. |
| 2 — Shells | **Done for the in-scope screens** — `(marketing)` route group restored per CLAUDE.md, footer extracted and made semantic, contact section extracted to one component, CMS shell split into shell + header with identity and sign-out. CMS responsive behaviour is sensible degradation, not Figma fidelity (no CMS mobile frames exist). |
| 3 — CMS slice | **Functionally complete and running against real data (D7).** Content sections persist atomically, publication works, the listing is real, paginated and now shows created/updated dates, validation and field errors exist, sign-in/out work, and the validation and schema/RPC contracts are covered by unit tests and a static cross-check. The authenticated screens still need a real session to exercise here, so their runtime behaviour is code-reviewed. |
| 4 — Public website | **Done apart from visual verification (D2/D3).** Metadata, canonicals, sitemap, Organization/WebSite/Product/BreadcrumbList JSON-LD, real images with alt text, semantic footer. The product detail page is now entirely CMS-driven, with content-defined height and the shared success-stories component. |
| 5 — QA | **Security now verified live; visual QA still blocked.** 112 unit tests, typecheck, lint and the production build pass; routes, honest error states, graceful degradation, palette conformance, heading structure, form labelling, image alt text, SEO metadata and client-JS footprint verified against a running server; loading/error/not-found boundaries build-verified; row level security exercised against the live project (below). Visual, responsive and typography fidelity remain blocked on D2/D3. |

### Phase 5 QA evidence

**SEO surface, verified against a real published product** (previously unverifiable because the
catalogue was empty): `/sitemap.xml` now lists the product URL alongside the two static routes;
the product page emits one JSON-LD block that parses cleanly and carries `Product` **and**
`BreadcrumbList`; `Product.name`, `description`, `url` and `image` come from the record; the
breadcrumb trail (`Home > Products > PANDORA 3.0 - Test`) matches the visible one; and there are
**no `offers`, `aggregateRating` or `review` keys** — no commercial facts are fabricated. Title,
canonical, `og:image` (absolute) and meta description are all correct, with the description reduced
to plain text so no formatting markers can leak into a search result.

**The authenticated write path is evidenced by its output.** No service-role credential exists here,
so the CMS cannot be driven from this session — but the live record shows the whole chain working:
one product with a product image, three content sections, four section images in the gallery, and
`published = true`, all of which only the CMS write path can produce.

**Performance, measured rather than assumed.** Two findings, one of them a real defect:

| Route | Before | After |
| --- | --- | --- |
| `/` | `HIT`, `s-maxage=300` | unchanged |
| `/products` | `HIT`, `s-maxage=300` | unchanged |
| `/products/[product]` | **`private, no-cache, no-store`** — an uncached Supabase round trip on every visit | **`HIT`, `s-maxage=300`** |

The detail route set `revalidate = 300` but had no `generateStaticParams`, so Next treated it as
dynamic and ignored the revalidation entirely. Adding `generateStaticParams` prerenders the known
products (`● (SSG)` in the build output, 5-minute revalidation) while slugs created later still
render on demand and are cached from then on — and a CMS save revalidates the path immediately.

**Accessibility audit of the CMS-driven product page**: 0 images without `alt` (24 checked, all
populated from the record or its section gallery), 0 inputs without a matching label, 0 controls
without an accessible name, 0 duplicate `id` values, exactly one `<h1>`, and no skipped heading
levels. Two apparent failures in the first pass turned out to be artifacts of the audit method and
were disproved rather than "fixed": PowerShell matched a per-line array instead of the document
string, and React's out-of-order streaming delivers some children in `<template>` placeholders that
are filled by inline scripts — the content was verifiably present in the stream (16 story cards'
worth of text and logo `alt` values). Inspecting streamed HTML with a plain fetch has to account for
both.

**Row level security, exercised against the live project with only the public key.** This is the
security requirement proven rather than reviewed:

| Attempt (anonymous key only) | Result | Meaning |
| --- | --- | --- |
| `INSERT` a product | **401** `42501` violates row-level security policy | denied |
| `UPDATE` a product | 204, **0 rows**, record byte-identical afterwards | filtered |
| `DELETE` a product | 204, **0 rows**, product still present | filtered |
| call `save_product_content()` with its full signature | **401** `42501` | denied |
| read `contact_submissions` | 200, **0 rows** | customer PII protected |
| read `profiles` | 200, **0 rows** | roles protected |
| insert a contact enquiry | **201** | public form works as designed |
| read published products | 1 row | public read works as designed |

The `204` responses are PostgREST reporting "no rows matched" rather than a write: the product title,
`updated_at`, its 3 sections and its 4 images were all verified unchanged afterwards. One clearly
labelled test enquiry row was created while proving the public insert path; it can be removed with
`delete from public.contact_submissions where email = 'verification@example.invalid';`.

**Static accessibility audit** of the rendered HTML for `/`, `/products` and `/cms/login`:
0 images without `alt` (34 / 18 / 1 checked), 0 visible inputs without an `id`, 0 inputs without a
matching `<label for>`, 0 buttons or links without an accessible name, 0 duplicate `id` values, and
exactly one `<h1>` per page with no skipped heading levels.

**Measured WCAG contrast** (computed, not estimated):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--foreground` `#3f3f46` on `--background` `#f1f5f9` | 9.53:1 | passes AA |
| `--heading` `#18181b` on `#f1f5f9` | 16.17:1 | passes AA |
| `--text-muted` `#71717a` on `#f1f5f9` | 4.41:1 | marginally below AA for normal text |
| `#71717a` on `#ffffff` (CMS surfaces) | 4.83:1 | passes AA |
| `--brand-ink` `#0f766e` (tags) on `#f1f5f9` | 5.00:1 | passes AA |
| `#a1a1aa` on `#18181b` (story cards) | 6.91:1 | passes AA |
| `#fefefe` on `#3f3f46` (CMS buttons) | 10.36:1 | passes AA |
| **brand-gradient label** `#18181b` on `#00c290` → `#1fadc5` | **6.62 – 7.69:1** | passes AA at every stop (was 2.30 – 2.68:1 with white, which failed AA at every size) |

Body copy on the product detail page was previously painted in `#94a3b8` (2.34:1, the design's
*placeholder* colour) and now uses `--foreground`. The two remaining marginal items are properties
of the design's own palette and are recorded as design decisions rather than silently changed.

**SEO surface** verified per route: distinct titles, meta descriptions, canonicals and Open Graph
URLs on `/` and `/products`; `noindex, nofollow` on the CMS; `robots.txt` disallowing `/cms/`. The
sitemap deliberately omits product URLs it cannot verify — which is why it listed only the static
routes while the catalogue was empty; it now includes every published product (see the live
verification above).

**Client JavaScript footprint**: exactly five files declare `"use client"`
(`product-carousel`, `product-form`, `login-form`, `publish-toggle`, `contact-form`) and each uses
genuine client APIs. Every other component, including the marquee, parallax and showcase sections,
is a Server Component.

**Unit tests** (`npm test`, Node's built-in runner — no test framework dependency added): 112 tests
over the logic the CMS slice depends on. `tests/register-alias.mjs` registers a resolver hook so
Node understands the `@/` alias; without it the query layer and the server actions could not be
loaded at all, which is why the first suite could only reach alias-free modules.

- `tests/auth-roles.test.ts` — the authorization policy: the exact role set, case-sensitive role
  validation, editor/admin write access, admin-only deletion, and the invariant that a role able to
  delete can also edit. These predicates mirror RLS, so a change without a matching migration now
  fails a test.
- `tests/product-validation.test.ts` — the full `parseProductForm` contract: required fields, slug
  normalisation and rejection, tag de-duplication and limits, the long/short content bounds, the
  two-slot first content block, alt-text/image pairing, dropping empty blocks, clamping an
  out-of-range section count, and reporting every field error at once.
- `tests/product-repository.test.ts` — row mapping (snake_case to domain shape, null columns,
  section and image ordering, no mutation of the source row) and the queries the data layer builds
  through an injected fake client: table, columns, ordering, publication filter, range arithmetic,
  head-only counting, and error propagation.
- `tests/product-queries.test.ts` — honest-failure semantics: unconfigured, half-configured and
  malformed environments all report rather than fabricate, and the sitemap lookup propagates failure
  instead of returning an empty list that would silently publish a product-less sitemap.
- `tests/contact-enquiry.test.ts` — required fields, e-mail rejection and acceptance, optional field
  bounds, the honeypot short-circuit, and that a valid enquiry is never silently swallowed.
- `tests/media-storage.test.ts` — allowed types, extension mapping, genuine PNG/JPEG/WebP headers,
  type/signature mismatch, truncated payloads, a RIFF container that is not WebP, that the size cap
  stays below Next's Server Action body limit, and the bucket env override.
- `tests/site.test.ts` — canonical origin resolution: unset, whitespace, trailing path, trailing
  slash, explicit port, malformed value, and absolute-URL joining.
- `tests/supabase-config.test.ts` — the project URL is reduced to its origin, covering the
  `…/rest/v1/` mistake that actually broke every request in one environment.
- `tests/richtext.test.ts` — the formatting subset: bold, italic, lists, paragraph and line-break
  rules, and the negative rules that stop ordinary prose and arithmetic becoming emphasis.
- `tests/product-errors.test.ts` — a missing schema is distinguished from an outage, and the
  underlying error can never reach the visitor.
- `tests/format.test.ts` — CMS timestamps render in UTC with the zone named, and an unusable value
  reads as "Unknown" rather than "Invalid Date".

**Schema/contract cross-check** (static, written when no database was available): the 12 parameters
sent to `save_product_content()` match the 12 declared in SQL by both name and position, and every
column in the data layer's select lists exists in the migrations — `products` (12/12), sections
(4/4), section images (3/3). This is the class of mistake `tsc` cannot catch against an untyped
Supabase client.

**Refactor from testing**: `lib/media/storage.ts` now exposes `getProductImageBucket()` instead of a
module-level constant, so the bucket can be overridden and tested without re-importing the module.

### Known gaps carried into the next round

- **The two hero blocks still carry minimum heights** (`min-h-[356px]` on `/`, `min-h-117.5` — 470px —
  on `/products`). The product detail page's frame-matched heights were all removed (see the
  detail-page entry below), so the worst case is gone, but whether these two read as empty space at
  mobile widths needs the mobile frames (D3).
- **`contact_submissions` has no rate limiting**; abuse protection is currently a honeypot only.
- **The authenticated screens need a real session to exercise here.** No service-role credential
  exists in this workspace by design, so `/cms/*` behaviour (the formatting toolbar, the new date
  columns, saving a product, role gating) is unit-tested and build-verified rather than observed.
  The client can confirm those in the browser.
- **The loading, error and not-found boundaries are build-verified only.** Exercising them needs a
  slow data source, a session, or a database (D7), so their runtime behaviour is code-reviewed.
- **`/products/[product]` has a loading state but the marketing routes as a whole do not.** The
  public pages are statically rendered with ISR, so only the on-demand detail route needed one.
- **The product carousel has no visible controls.** Auto-advance now respects reduced motion and
  pauses on hover/focus, but a screen-reader user has no discoverable pause, and off-screen cards
  are reachable only by tabbing. Fixing this properly means adding controls the Figma frames do not
  define, so it needs a design decision.
- **An unapproved account is redirected to the sign-in screen** with an explanation, rather than
  shown an empty CMS. The redirect needs a live session to exercise, so it is unit-tested at the
  decision boundary and code-reviewed.
- **Deferred by request:** making the carousel slow down (rather than stop) on hover, or advancing it
  on scroll — Round 14 deliberately left both marquees and the carousel on their existing CSS
  animation. Also deferred: the Figma reference exports (D2/D3). The canonical hostname (D6) closed in
  Round 12. Scroll-triggered motion was deferred until after the mobile pass and delivered in Round 14
  (D9). And the success-story cards have no destinations yet: each needs a real target, plus a decision
  on whether the arrow is separately clickable (Round 15).

---

## 10. Implementation log

Recorded so the next round can tell what changed and why.

**Phase 0** — `product-carousel.tsx` hook-order error fixed (`useMemo` moved above the early
return); three unused symbols removed; `npm run typecheck` added; `.env.example` created and
un-ignored; `FIGMA.md` line 8 relabelled as the mobile frame.

**Phase 1** — `app/globals.css` rebuilt from the extracted palette with a brand-gradient token,
focus-ring and radius tokens; 32 invented hex occurrences replaced across 8 files (verified zero
remaining in rendered HTML). `lib/supabase/public.ts` introduced for cookie-free public reads,
`lib/products/queries.ts` rewritten around typed results, and `lib/products/mock-data.ts` deleted —
fixtures now live only in `supabase/seed/001_products.sql`. Migration `002_*` adds roles, RLS,
publication, galleries, the Storage bucket, lead capture and the atomic `save_product_content()`
function. `lib/auth/` adds session and role guards.

**Phase 3** — `saveProduct` now writes sections and gallery images atomically through the RPC and
revalidates public paths; `setProductPublished`, `signOut` and `uploadProductImage` added; the form
gained real uploads, field-level errors, length limits and alt-text validation; the listing shows
real data with working pagination, drafts and a real switch; the create heading and the hardcoded
`updated_at` are fixed.

**Phase 4** — `/` gained Organization + WebSite JSON-LD and its own metadata; `/products` gained
metadata and an honest error state; `/products/[product]` gained Product + BreadcrumbList JSON-LD, a
visible breadcrumb, real content sections and images, and lost its `slug === "pandora"` special
case; `sitemap.ts` now enumerates published products; the three duplicated footers and contact
panels became `SiteFooter` and `ContactSection`.

**Verification evidence** — `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run build` exit 0
with `/` and `/products` prerendered as static (5-minute revalidate) and `/cms/*` dynamic; smoke
test of 8 routes against `next start` returned 200 with the documented unavailable notices where no
database is configured; zero design-absent hex values in the rendered HTML.

**Round 2 — closing what can be closed without a database.** Added a dependency-free unit suite
(`npm test`, 34 tests) and a static schema/RPC cross-check, both described under Phase 5 QA evidence
above; this is the closest obtainable substitute for the round-trip that D7 blocks. Fixed a
contrast misuse (body copy was painted in the design's placeholder colour), labelled the previously
unlabelled upload inputs, corrected the error page's reference colour, and rewrote `README.md`,
which was still untouched `create-next-app` boilerplate. Investigating the two untracked PNGs at the
repository root showed a `Software.Figma` text chunk but **no node id**, so they cannot be renamed
to the `docs/design/` convention without guessing — the follow-up stays open.

Two query-layer corrections came out of the same pass: every list read was requesting a
`COUNT(*)` no caller used, and the CMS list fetched a whole page of rows purely to learn the total
before fetching the real page. Counting is now a separate head-only query (`countProducts`), so
public list reads no longer pay for a count and the CMS list uses two cheap queries instead of one
wasteful one.

**Round 3 — a real bug found by making the code testable.** `getSupabasePublicClient()` and
`createSupabaseServerClient()` let `createClient` throw on a malformed `NEXT_PUBLIC_SUPABASE_URL`,
and that call sat *outside* the `try` in every caller — so a single typo in an environment variable
would have turned every public route and the whole CMS into a 500 instead of degrading honestly.
Both factories now fail soft, and `proxy.ts` validates the URL before use and continues to fail
closed. Verified end to end: built with `NEXT_PUBLIC_SUPABASE_URL=not-a-url`, the build still exits
0, `/products` returns 200 with the "not connected" notice and no error page, and `/cms/products`
still 307s to the login page.

Coverage grew from 34 to 69 tests in the process, which required teaching Node the `@/` alias
(`tests/register-alias.mjs`): Node's native TypeScript support ignores tsconfig `paths`, so the
query layer and the server actions were unreachable from a test before this. Two further seams came
out of it: `lib/auth/` now separates role policy (`roles.ts`, pure and tested) from session
resolution (`session.ts`, which imports `next/headers` and therefore cannot load outside Next at
all), and the media bucket is resolved per call instead of at module load. Two of the new tests
initially failed against a wrong assertion of mine about how PostgREST errors surface — the tests
were corrected to the real shape (plain objects, not `Error` instances) rather than the code being
changed to match the test.

**Round 4 — the remaining Definition-of-Done states.** The DoD requires loading, empty and error
states to work, and the CMS had none of the three at route level. Added:

- `app/(cms)/cms/loading.tsx` and `app/(marketing)/products/[product]/loading.tsx`, built from a
  shared `components/ui/skeleton.tsx`. Figma defines no loading frames, so these are deliberately
  plain — the design's own muted surface token and documented radius, no invented colour or type.
  The skeleton stops animating under `prefers-reduced-motion`, which Tailwind's built-in
  `animate-pulse` would not have done.
- `app/(cms)/error.tsx`, which renders *inside* the CMS shell (a segment's error file does not wrap
  that segment's own layout) so the header and session controls survive a failure.
- `app/(cms)/not-found.tsx`, so `notFound()` from a CMS screen keeps the visitor in the CMS with a
  route back to the product list instead of dropping them on the public 404.
- The publication switch now surfaces its success message politely; it previously computed one and
  discarded it.

Next 16 ships `forbidden()` / `unauthorized()` conventions, which would be the idiomatic home for
the role-gated CMS screens, but the bundled docs still mark them `version: experimental`. They were
therefore **considered and not adopted**: the existing role-gated notices and server-side guards are
stable behaviour and need no experimental flag.

**Honest limitation on this round's verification**: the loading, error and not-found boundaries are
verified by a green build (both loading fallbacks are present in the build output, and the compiled
stylesheet contains the repaired `marquee-rtl` keyframes and the new `.skeleton` rules), but they
cannot be *exercised* here — the loading state needs a slow data source, and the CMS boundaries need
a session and a database (D7). Their runtime behaviour is code-reviewed only.

One self-inflicted error worth recording: an edit to `app/globals.css` accidentally deleted the body
of the `marquee-rtl` keyframes, which would have silently broken the client-logo and success-story
marquees. It was caught by inspecting the file rather than trusting the edit, repaired, and then
confirmed present in the compiled CSS bundle.

**Round 4, second pass — reduced motion.** `product-carousel.tsx` auto-advanced on a JavaScript
interval with no `prefers-reduced-motion` check: the only animated component in the codebase that
ignored the preference (the marquees are disabled under reduced motion in `globals.css`, and
`product-coverflow.tsx` checks it). Auto-advance is now off until the preference has been read,
follows changes to it mid-session, and stops while the strip is hovered or focused — giving pointer
and keyboard users a pause mechanism, which WCAG 2.2.2 (Pause, Stop, Hide) requires for
auto-updating content. The success-story marquee now also pauses on `focus-within`, not only on
hover.

Residual, and it needs a design decision: the frames define no carousel controls, so there is no
visible pause button or previous/next affordance and a screen-reader user has no discoverable way to
stop the strip. Adding one means adding UI the design does not contain.

**Round 5 — a security hole found while re-checking the environment.** The schema is still not
applied, but probing the project's auth settings revealed `disable_signup: false`: public sign-up is
open. Combined with the migration as first written, that was exploitable — the `on_auth_user_created`
trigger gave every new account a `viewer` profile, and the `viewer` role could read **unpublished
product drafts** and **every submitted customer enquiry** (names, e-mail addresses, messages). Anyone
who could reach a sign-up form could have read them.

Fixed on both sides of the boundary, in the migration that had not yet been applied:

- `profiles.approved` (default `false`) and `current_user_role()` now returns a role **only** for
  approved accounts, so every existing policy — reads and writes alike — also enforces approval. An
  account that has not been approved resolves to no role at all.
- `contact_submissions` reads are narrowed from *all staff* to **`admin` only**. The CMS has no
  screen for enquiries, so nothing needed that access, and customer PII now has the smallest
  readable surface available.
- App-side, `resolveSessionRole()` treats an unapproved profile as no session, so the CMS presents a
  signed-out interface rather than a confusing empty one. The rule is pure and unit tested; the
  database enforces it independently.
- Bootstrap and seed instructions now grant `role` **and** `approved`, since setting the role alone
  grants nothing. README, DATABASE.md and the CLAUDE.md decision register were updated, and disabling
  public sign-up is recorded as the recommended project setting.

Also in this round: a failed read now distinguishes a **missing schema** from an outage. Previously
every `PGRST205` surfaced as "temporarily unavailable", which points at the wrong problem. It now
reads "The product catalogue has not been set up yet." for visitors, and names the migrations for
staff in the CMS — while confirming no table name, error code or connection detail reaches the page.
Verified live against the real project: the exact `PGRST205` path renders the new message with zero
leaked internals. The client resolved one of the four blockers and removed the dead
component, and deferred the rest:

- **Brand-gradient label colour (resolved).** The label is now `--brand-foreground` (`#18181b`,
  zinc-900) instead of white: measured **6.62–7.69:1** across the three stops, up from 2.30–2.68:1,
  so every primary CTA now passes WCAG AA. Applied through the shared `Button` variant and at all
  six remaining `cta-gradient` call sites; verified in rendered HTML that no `cta-gradient` element
  still carries `text-white`.
- **`product-coverflow.tsx` deleted by the client.** Verified: the file is gone and no source file
  references `ProductCoverflow`.
- **Deferred:** the Figma reference exports, the canonical hostname, and two carousel behaviour ideas
  (slow down rather than stop on hover; advance on scroll).
- **Supabase project verified reachable; the schema has not been applied.** The credentials were
  found in `.env.example` — the committed template — rather than `.env.local`. They have been moved
  to the git-ignored `.env.local` and the template reset to empty values, so nothing was ever staged
  for commit. The first probe failed on every path with `PGRST125`; the cause was that the value was
  the Data API URL (`…/rest/v1/`) rather than the project URL. Once corrected, `GET
  /auth/v1/settings` returns 200, so the URL and the `sb_publishable_…` key are both valid. But
  `products`, `product_content_sections`, `product_content_section_images`, `profiles` and
  `contact_submissions` all return `PGRST205 Could not find the table … in the schema cache`, the
  `product-images` bucket returns `NoSuchBucket`, and `save_product_content` does not exist.
  **Neither migration has been run**, so the authenticated and write paths stay unverified.
- **That misconfiguration can no longer fail silently.** `lib/supabase/config.ts` resolves the
  configured value to its origin and rejects anything that is not http(s); all three call sites
  (anonymous client, server client, request proxy) go through it, and
  `tests/supabase-config.test.ts` pins the behaviour, including the exact `/rest/v1/` case that
  occurred.

Verified live against the real project: `/products` renders the **"temporarily unavailable"** state
— the query-failure path, distinct from "not connected" — and logs `PGRST205` server-side rather
than swallowing it, with no fabricated products substituted; `/cms/products` still 307s to the login
page. One caveat for after the migrations are applied: `/` and `/products` are prerendered with a
5-minute revalidate, so the cached unavailable state can persist for up to five minutes (or a
restart) before it clears.

Incidental verification: `/definitely-not-a-page` now returns a real **HTTP 404** with the styled
not-found page, which is the first end-to-end confirmation of the 404 handling requirement (it was
previously code-reviewed only).

**Round 6 — finishing the approval story.** Round 5 stopped the security hole but left a rough edge:
an account that had signed up and not been approved saw a read-only, empty CMS that looked broken.
The layout now distinguishes the three access states explicitly — anonymous, **pending**, and active
— and redirects a pending account to the sign-in screen, which explains that an administrator must
grant access. The distinction is deliberate: pending is not the same as anonymous, and conflating
them is what produced the confusing screen. `getAccessState()` is wrapped in React's `cache`, so the
layout and the page it renders share one session lookup per request instead of each doing its own.

Verified: `/cms/login?state=pending` renders the explanation alongside the sign-in form, `/cms/login`
without it renders no notice, the notice is announced politely rather than as an error, and no
internal detail reaches the page. `/cms/login` moves from static to dynamic as a result, which is
correct for a page whose content now depends on a query parameter.

The redirect path itself cannot be exercised here — it needs an approved/unapproved account in a
project whose schema exists — so it is unit-tested at the decision boundary
(`resolveAccessState`, five cases) and code-reviewed rather than confirmed end to end.

**Round 7 — first round against real content.** The client applied the migrations, created an
approved user and published one test product, which turned the whole plan from review into
observation. Six reported issues, all reproduced against the live data first and all fixed:

- **"Three products from one record."** The database held exactly one product while `/products`
  rendered three cards. Not a data problem: `ProductCarousel` rendered `COPIES = 3` copies of the
  list to make the loop seamless, so a single product appeared three times. The copy count is now
  adaptive — a looping strip only when there are at least three products, otherwise one copy with
  auto-advance off, because with fewer there is nothing to advance to without repeating a card.
- **The detail page was not generic.** It carried static marketing copy (two hero paragraphs, a
  "Multi-service platform" heading and a "Customizability" block) so a CMS user's own headings and
  description were rendered as subordinate text. The page is now entirely CMS-driven: the hero shows
  the record's description, and every content section renders its own heading as an `h2` with its
  body and images. No product copy is hardcoded, which is what makes one template serve any product.
- **Frame heights forced huge gaps.** Sections carried `min-h` values copied from the desktop frame
  (up to 2192px), padding a short product out to a frame's height. All five are removed on this
  page; content now defines the height.
- **A duplicated component.** The detail page rendered its own success-story cards while the
  homepage used the shared `SuccessStoriesCarousel`. The shared component is now used in both, which
  also removes the last duplicate implementation of a design section.
- **The CMS form's field order** now matches the layout the client specified: left column = title,
  path, image, acquisition/locations, CTA; right column = description, tags, then the content
  blocks.
- **The CMS list shows created and updated dates**, via a shared `formatTimestamp` that states UTC
  explicitly so no date is ambiguous.

**Rich text (new).** Content bodies gained Bold, Italic and List, stored as a deliberately small
markdown subset (`**bold**`, `*italic*`, `- list`) and rendered to React elements — never to raw
HTML. There is no HTML input, so there is no sanitizer to get wrong: stored content cannot execute.
The negative parsing rules matter as much as the positive ones and are pinned by tests, including
the rule that stops `5 * 3 = 15` from becoming emphasis. A bug where an unclosed `**` let its second
asterisk open an italic span was caught by those tests and fixed.

Verified against the live product: **1** card on `/products` (was 3), the three static strings
absent, the CMS headings rendering as `h2`, zero frame minimum heights, and the shared marquee
present on the detail page. The toolbar and the new columns were confirmed present in the build
output; the CMS screens themselves still need a session to exercise, so those remain code-reviewed
and unit-tested rather than observed.

**Round 8 — security QA, finally provable.** With the schema live, the row level security policies
could be attacked instead of merely read. Every attempt used only the public key that ships to the
browser: inserting, updating and deleting a product were all refused, `save_product_content()` was
refused even when called with its complete signature, `profiles` and `contact_submissions` returned
zero rows, and the two flows that *should* work — reading published products and submitting an
enquiry — both succeeded. The full table of results is in the Phase 5 evidence above.

Two things were checked rather than assumed. `UPDATE` and `DELETE` answered `204`, which looks like
success, so the record was read back to confirm the title, `updated_at`, its sections and its images
were untouched — PostgREST reports "no rows matched" the same way it reports a write. And the first
RPC probe returned a misleading `404` because the call was missing arguments, so PostgREST never
resolved the function; sending the full signature produced the real answer, a `401` from the
permission check. One clearly labelled test enquiry row remains in the table as a result, with the
SQL to delete it recorded.

Also in this round: the decision register, the phase status table and the gap list were corrected,
since they still described the database as un-applied. The remaining SEO items that had never been
observable with an empty catalogue — the sitemap entry and the structured data for a real product —
were verified, along with the write path's output (see the Phase 5 evidence above).

**Round 9 — performance, and the audit catching itself.** Caching was measured instead of assumed,
and the product detail route turned out to be rendered on every request (`private, no-cache,
no-store`) despite carrying `revalidate = 300`: without `generateStaticParams` Next treats the
dynamic segment as dynamic and the revalidation never applies. With the slugs enumerated at build
time the route is now `● (SSG)` with a 5-minute revalidation and a `HIT` response, while products
created later still render on demand and are cached from then on. The accessibility audit of the
newly CMS-driven page came back clean, but only after two false failures were disproved — a
PowerShell array-matching quirk in the audit, and React's streamed `<template>` placeholders — both
recorded above so the next audit does not repeat them.

**Round 10 — the contact form was broken in the browser.** The client reported that submitting the
form threw `A "use server" file can only export async functions, found object` and dropped them on the
error page. The cause was in `lib/leads/actions.ts`: alongside the async action it exported
`EMPTY_CONTACT_STATE`, a plain object. Next.js permits only async functions to be exported from a
`"use server"` module, and it enforces that when the browser loads the action module — so the failure
appeared on click rather than at render.

**None of the project's gates could have caught it.** Typecheck, lint and `next build` all passed with
the invalid export present, and the page rendered correctly over HTTP; the rule is enforced by the
runtime loader alone. This is exactly the class of defect the previous round's report listed as
unverifiable from here — client-side behaviour with no browser — and it is the one that got through.

Fixed by moving the state type and the initial value into `lib/leads/types.ts`, a plain module, leaving
only the async action in the server module. To stop it recurring,
`tests/server-actions.test.ts` now scans every `"use server"` module in `app/` and `lib/` and fails if
it exports anything other than an async function or a type. The guard was **proved non-vacuous** by
temporarily reintroducing the offending export, confirming the test fails, then restoring the file. It
covers all three server-action modules; the other two were already compliant.

Verified after the fix: the action module evaluates cleanly, `submitContactEnquiry` is callable, and
its validation, rejection and honeypot paths all behave — `lib/leads/actions.ts` no longer mentions
the constant at all. The final confirmation is the client clicking the button, which no amount of
server-side checking can substitute for.

One self-inflicted error to record: restoring that file with a PowerShell write added a UTF-8 BOM. A
scan of every source file found exactly that one, and it was stripped by rewriting the file without a
BOM.

**Round 11 — the enquiry inbox and the notification path.** With the form fixed, the client approved
the missing half of the feature: somewhere for a lead to go and a way to be told about it.

- **`/cms/inquiries`** (administrator-only) lists submissions newest first: received time, name,
  e-mail as a `mailto:` link, company, location, message and source page, with paging, an empty state
  and an error state. RLS already permitted admin reads, so no migration was needed; the page checks
  the role first, because an editor's query would return zero rows and look like an empty inbox
  rather than a permission boundary.
- **Optional notification.** `lib/leads/notify.ts` posts a JSON payload to `INQUIRY_WEBHOOK_URL` if
  it is set: a Teams workflow, a Slack webhook, or any JSON endpoint. It carries a ready-to-post
  `text` summary plus the individual fields. It never throws and the row is written **before** it
  runs, so a notification failure cannot lose a lead — which is the reason the inbox is the
  authoritative record and the webhook is a convenience.
- The CMS header gained a small nav (Products, plus Inquiries for administrators).

**Verified end to end without a browser**: a local echo endpoint stood in for Teams, the action was
invoked with a real submission, and the webhook received the full payload. Because the notification
only runs after a successful insert, that single result proves the whole chain — form, action,
database row and notification.

Two deliberate choices worth recording. The notification is **awaited rather than dispatched with
`after()`**: `next/server` cannot be imported by this project's test harness, so using `after()`
would have made the action module untestable, and a 4-second timeout bounds the delay. And
`DataResult` and `formatTimestamp` moved to neutral modules (`lib/result.ts`, `lib/format.ts`) rather
than being reached across domains from the new leads code.

**Round 11, follow-up — the Teams card.** Wiring the client's Power Automate flow surfaced a real
incompatibility. Their flow came from the Teams *"When a Teams webhook request is received"*
template, which is built for the legacy Office 365 connector shape: it branches on whether
`attachments` exists and then posts `item()?['content']` as a card. The original flat payload had no
`attachments`, so the flow took the branch that hands its card action a body which is not a card —
`The specified Teams flowbot message's message body is invalid JSON`.

Fixed on this side rather than by editing their flow: the payload is now a **superset** carrying both
the flat `text` and fields (for Slack, a plain message action, or any other consumer) and an
`attachments` array holding a real Adaptive Card with the enquiry in it. The stock template therefore
takes its attachments branch and the token the designer offered — `item()?['content']` — is correct
as generated. Verified by posting the new payload to the live endpoint (HTTP 200) and by tests that
pin the connector shape, the card contents, and the omission of blank fields.

**Round 12 — hosting on Render at `business.qubesmartlockers.com`.** The client's hosting plan
supersedes the Vercel entry the Core Stack had carried since the first round, and it closes the last
open input: the canonical origin (D6).

- The code needed no porting: a search found no Vercel-specific API anywhere. The app is a
  conventional `next start` Node server, which actually suits its caching model better than a
  serverless host — the prerender cache lives in the instance.
- **`render.yaml`** records the deployment contract: `npm ci && npm run build`, `npm start`, a health
  check on the static `/robots.txt`, and the environment variables, with the secret ones marked
  `sync: false` so they are entered in the dashboard rather than committed.
- **`package.json` now declares `engines.node >= 22.18.0`** — the version at which Node executes the
  test suite's TypeScript natively, and the field Render reads to pick a runtime.
- **`lib/site.ts` changed behaviour.** A production build missing `NEXT_PUBLIC_SITE_URL` used to fall
  back to `http://localhost:3000`, which would have poisoned every canonical URL, Open Graph tag and
  sitemap entry at once. It now falls back to the production origin and still warns; local
  development keeps the localhost fallback. Covered by four new tests, including that an explicit
  value still wins in production.
- Documentation corrected: the Core Stack, the README's deployment section (build/start commands, the
  GoDaddy CNAME, the Supabase URL configuration, single-instance caching, free-tier spin-down), and
  the CMS form's `business.qubesmartlockers.com/` path prefix, which is now confirmed rather than
  assumed.

`NEXT_PUBLIC_*` values are inlined at build time, so changing one on Render requires a redeploy
rather than a restart — noted in the README because it is an easy trap.

---

**Round 13 — the mobile pass.** The client spot-tested the deployed site on a phone and returned seven
concrete defects. All seven are fixed; none needed a data, security or architecture change.

1. **The navbar had no collapsed state** — the inline row simply overflowed. `SiteNav` now renders the
   inline row from `lg` up only and hands narrow viewports to a new
   `components/layout/mobile-nav.tsx`: a disclosure button wired with `aria-expanded`/`aria-controls`,
   Escape to close with focus returned to the button, and close-on-navigate. The panel is anchored to
   the header (`relative`) rather than to the header's `max-w-[1040px]` container, so it spans the
   viewport instead of stopping at the content edge.
2. **The `PANDORA 3.0 | … | →` eyebrow row** was `justify-end`, which on a phone pressed it against the
   right edge. It is now left-aligned below `lg` and unchanged above it, on `/` and `/products` alike.
3. **The client-logos section** gained top padding on narrow viewports (`pt-24`); the `lg` spacing is
   untouched.
4. **"Check our product suite"** was a flex child in a column, so it stretched to the full width. It now
   carries `w-fit`.
5. **The Pandora showcase grid** had `gap-3` below `sm`, separating panels the design shows joined. The
   gap classes are gone at every breakpoint, which is what the desktop layout already did.
6. **The `/` and `/products` H1s** are tighter below `lg` (`leading-[1.05] tracking-tight`) and unchanged
   above it, following the client's "a little tighter". These are **inferred** values, not measured ones:
   the committed Figma exports are outline-converted, so leading and tracking cannot be read from the
   design and were adjusted relative to the sizes already in the code.
   6b. **The product carousel's edge gradients are hidden below `lg`.** The 200px fades at each end
   covered most of the strip on a phone; from `lg` up they are unchanged.
7. **Inputs are 16px on touch-sized viewports.** iOS Safari zooms the page when a control smaller than
   16px takes focus, which left the contact form scrolled sideways mid-entry. `.landing-input` is `1rem`
   by default and returns to the design's `0.75rem` from `lg` up. It is a rule in `globals.css` rather
   than an inline size, so the value stays a single point of change.

**Verified**: `npm test` 131/131, `npx tsc --noEmit` exit 0, `npm run lint` exit 0, `npm run build`
exit 0 with `/` and `/products` still static (5-minute revalidate) and `/products/[product]` still SSG.
Eleven markers were then read back out of the prerendered HTML and the built CSS: the disclosure button
on both pages, the desktop row still inline, both eyebrow rows, the new section padding, the `w-fit`
button, both H1 treatments, the two `lg:block` carousel fades, and `.landing-input` at `1rem` with its
`lg` override.

**Not verified**: no browser is available here, so items 2–6 are confirmed as markup rather than as
pixels, and the collapsed menu was checked by reading the component and its rendered attributes rather
than by tapping it. Those items are inferred mobile values throughout, for the reason given in item 6;
if they read wrong on the device, each is one class to adjust. The client deferred scroll animations
until after this pass ("Let's update this first before adding animations on scroll"), so they remain the
next round's scope.

---

**Round 14 — the motion system (D9).** The client asked for scroll animations across the public
pages and approved Motion as the system, with the constraints below. Nothing was redesigned: at rest
every page is identical to Round 13.

- **Scope, enforced rather than intended.** `MotionProvider` is mounted by a new
  `app/(marketing)/layout.tsx`, which previously did not exist — adding it is the whole point, since
  the root layout would have loaded the animation runtime into `/cms/*`. Two tests hold that line:
  one fails if any file under `app/(cms)` or `components/cms` imports the motion module, the other if
  the provider is mounted anywhere but that layout.
- **A vocabulary, not per-component timing.** `components/motion/tokens.ts` holds every duration,
  easing, distance and stagger; `variants.ts` turns them into the five effects the site uses
  (`revealRise`, `revealFade`, `heroRise`, `routeEnter`, `panelDrop`). Pages compose those and never
  write a transition inline. Sixteen new tests pin the rules: that no variant animates anything but
  `opacity` and `y`, that the stagger is capped so a nine-cell grid cannot still be settling half a
  second after its first cell, that no duration is long enough to read as slow, and that
  `globals.css` mirrors the same numbers exactly.
- **Two primitives that render the element you ask for.** `Reveal` and `HeroReveal` take an `as` prop
  (`h1`, `section`, `article`, `li`, …) and render that tag instead of wrapping children in a div.
  This was not cosmetic: several sections are seamless grids whose shared 1px rules and
  `lg:col-start-*` placement live on the child element, so an inserted wrapper would have moved the
  grid item and broken the gapless panel the client had just approved. Anchors are deliberately
  absent from the allowed tags, because these are motion elements rather than Next `<Link>`s and
  rendering a link through one would replace client-side navigation with a full page load — a test
  fails if one is ever added.
- **The largest-contentful-paint rule.** The hero heading is the LCP element on `/` and `/products`,
  and text at `opacity: 0` is not a valid LCP candidate, so the above-the-fold entrance animates
  transform only. Verified in the built HTML: the `h1` carries `style="transform:translateY(12px)"`
  and no opacity, while the below-fold reveals ship hidden. Everything that straddles the fold — the
  hero video block, the product carousel strip — rises on mount rather than waiting for a scroll
  trigger, so a half-visible section is never a hole. *(Superseded by the Round 14 follow-up below,
  which trades this LCP position away at the client's request.)*
- **Where motion would have broken existing work, it was declined.** Cells in the seamless showcase
  and features grids fade without moving, because translating one pulls the shared borders apart
  mid-animation; the sticky workspace card takes no transform; the route wrapper takes no transform
  either, since a transform on a wrapper containing a whole page becomes the containing block for
  every fixed-position descendant and would surface later as a broken sticky header somewhere
  unrelated. The product carousel and both marquees keep their existing CSS animation untouched: the
  carousel's cards own their inline transition for the tiered resize, and re-implementing that in
  Motion would have been a rewrite of working code.
- **Route transitions, enter only.** `app/(marketing)/template.tsx` animates the page in on client
  navigation and skips the first load entirely (`initial={false}`), so a hard load paints immediately
  instead of waiting on hydration. There is no exit animation: the App Router discards the outgoing
  tree, and the frozen-router workaround that an exit needs interferes with streaming and server
  components.
- **Micro-interactions stayed in CSS.** Hover lift and press feedback are two utility classes reading
  the same tokens as the JavaScript, wrapped in `@media (hover: hover)` so a lift cannot stick to a
  tapped element on a touch screen. A hover state fires on every pointer crossing; paying for a
  runtime there would be waste.
- **Reduced motion.** `MotionConfig reducedMotion="user"` removes transform and layout animation for
  visitors who ask for it, and the primitives pass a zero-length variant on top, so that preference
  means the element is simply present rather than fading in. The CSS utilities are switched off in
  the same media query, matching how `globals.css` already treated the skeleton and the marquees.
- **No JavaScript.** Reveals ship their hidden state in the markup, so the root layout carries a
  `<noscript>` rule restoring `opacity` and `transform`. Without it, half the landing page would be
  invisible with scripting off.

**Verified**: 147 tests (16 new), `npx tsc --noEmit`, `npm run lint` and `npm run build` all exit 0,
with `/` and `/products` still static and `/products/[product]` still SSG — the new layout and
template changed no caching behaviour. Twelve checks were read back out of the prerendered HTML,
including the LCP rule above, the no-JavaScript fallback, and that no CMS page contains a single
motion attribute. The two most important guards were proved non-vacuous by breaking what they
protect: adding `opacity` to the hero variant and moving a CSS token each produced the intended
failure with the intended message, and both were reverted. The escape hatch was exercised rather than
assumed: with `MOTION_ENABLED = false` the build produces zero hidden reveals, no transform on the
hero, and a plain `<nav>` for the panel — and still ships the vendor chunks, which is why that
distinction is written down instead of promised away.

**Cost, measured rather than quoted.** The three vendor chunks carrying the runtime total **32.4 KB
gzipped**, taking `/` from roughly 27 KB to 59 KB of JavaScript. Motion's own documentation predicts
about 20 KB for this configuration, measured with Rollup; Turbopack tree-shakes less well, which its
docs acknowledge. Recorded because it is the real price of the decision rather than the advertised
one — the alternative, CSS transitions driven by one `IntersectionObserver`, would have cost under
2 KB.

**Not verified**: there is no browser in this workspace, so how the motion *feels*, the hover and
press states, and the reduced-motion experience are unconfirmed as pixels and need the client's
device — the same limitation Round 13 recorded, and the reason the vocabulary is deliberately small.
One residual risk is worth naming: with JavaScript enabled but the bundle failing to arrive, the
below-fold reveals would stay hidden. The `<noscript>` rule covers scripting switched off, not a
failed script; the same class of dependency already exists for the contact form.

**Round 14, follow-up — the hero cascade.** The client asked for the hero to fade rather than only
rise, and confirmed the cascade over a strict one-at-a-time sequence. The above-the-fold entrance is
now three roles, 60 ms apart:

| t | Element | Motion |
| --- | --- | --- |
| 0 ms | `h1` | opacity 0→1, y 16→0, 260 ms |
| 60 ms | CTA | opacity 0→1, y 12→0, 300 ms |
| 120 ms | eyebrow row | opacity 0→1, y 12→0, 300 ms |
| 180 ms | hero visual | opacity 0→1, y 20→0, scale 0.99→1, 450 ms |

`heroRise` became `heroHeading` / `heroSupport` / `heroVisual`, selected by a `variant` prop on
`HeroReveal`. Reduced motion is unaffected: the fade collapses to zero duration like the rest of the
system.

**What that costs, recorded rather than glossed.** The heading is the largest contentful paint element
on `/` and `/products`, and text at `opacity: 0` is not a valid LCP candidate. Round 14's
transform-only entrance kept the measured paint at first paint; this one moves it to roughly 260 ms
later. The client accepted that trade explicitly, and two rules keep it as small as it can be: the
heading takes the shortest fade in the system, and it takes no index at all — `heroHeading()` has no
parameter, so a stagger delay cannot reach the measured element even by mistake.

The test that used to assert "the hero never animates opacity" was replaced rather than deleted. It
now asserts that the fade exists, that the heading is the fastest of the three roles, that its
duration stays under 300 ms, and that only the visual scales; a second test pins the 0/60/120/180 ms
order to the storyboard the client approved. Both were proved non-vacuous by setting the heading
duration to 600 ms, which failed the duration band, the fastest-element rule and the CSS mirror
together, then reverted.

**Verified in the built markup** by initial style: exactly one element at `translateY(16px)` (the
heading), two at `translateY(12px)` (CTA and eyebrow), one at `translateY(20px) scale(0.99)` (the
visual), with the below-fold reveals unchanged at `translateY(20px)` and opacity-only.

**Round 15 — one client-logo list instead of two.** The eight client logos were declared twice, byte
for byte: once in the hero strip (`hero-video-section.tsx`) and once over the client marquee
(`client-logo-marquee.tsx`), so a ninth client meant editing two files and keeping them in step by
hand. Both now map a single `CLIENT_LOGOS` list in `components/layout/client-logo-grid.tsx`.

The two grids are not identical, and the component reproduces all three differences rather than
normalising them: the gaps (`gap-x-10 gap-y-6` against `gap-x-8 gap-y-4`), the image class (`h-auto
w-auto` against `h-auto max-h-8 w-auto opacity-90`), and whether each logo sits inside a centring div
— the hero wraps each one, the marquee does not, because its cells are content-sized. Normalising any
of those would have been an unrequested visual change, and there is no browser here in which to judge
it; reconciling them is a design decision.

**Parity was proved rather than assumed.** The two rendered blocks were captured from the previous
build and compared byte for byte with the new one: 1813 and 1548 characters, both identical. Four new
checks keep it that way — the list is declared in exactly one place, both instances render the shared
component and keep no local array, every logo still carries alt text and real dimensions, and the five
class strings that define the two contexts must all survive.

**The success stories stay a dataset of their own.** They draw on the same eight logo files, but they
are stories — each with its own destination and its own order — so `success-stories-carousel.tsx`
keeps its own records rather than becoming a third consumer of the client list. That file now also
carries the note for the next task: every card points at `href: "#"` and the arrow in "Read Story →"
is part of the card's link rather than a control of its own.

**Round 15, follow-up — the logos reveal in sequence.** The client asked for each client logo to
animate one after another as the strip enters the viewport, with opacity and position. Both grids now
map to `RevealImage` (`components/motion/reveal-image.tsx`), which fades and rises each logo 50 ms
after the one before it, once, on viewport entry.

Two decisions worth recording:

- **The image animates, not a wrapper around it.** `m.create(Image)` makes the `next/image` element
  itself the animated node. That matters because the marquee grid's logos *are* their own grid items:
  wrapping them to animate them would have changed the grid, and the hero strip's centring wrapper had
  to be preserved rather than normalised. Verified by comparing the rendered blocks with the
  pre-animation build with the motion attributes stripped — identical in both contexts, with the hero's
  eight wrapper divs and the marquee's zero both intact.
- **The sequence is uncapped, deliberately.** The general stagger caps its step count so an open-ended
  list cannot drag; the logo strip is a fixed eight, so its tail is bounded by construction
  (7 × 50 ms = 350 ms) and every logo gets its own beat instead of the last three sharing a delay.
  `logoDelay` is a separate helper for that reason, and a test asserts the variant uses it rather than
  the capped one.

The strip sits inside a section that already reveals itself, so this reads as a ripple within that
fade rather than as a second competing entrance. Reduced motion collapses the sequence to zero
duration like the rest of the system.

**Round 16 — the image upload that hung.** The client reported the CMS upload field stuck on
"Uploading image...". Two separate faults, and fixing only one would have left the other.

- **Why it failed.** The cap was 5 MB, but Next refuses a Server Action request body larger than
  `experimental.serverActions.bodySizeLimit`, which defaults to 1 MiB and which `next.config.ts` never
  raised. An image over that limit was rejected with a 413 *before* `uploadProductImage` ran, so the
  action's own 5 MB check was unreachable code and no validation message was ever produced. Confirmed
  against the installed version rather than remembered: `action-handler.js` carries
  `defaultBodySizeLimit = '1 MB'`, and `config-schema.js` shows the option is still under
  `experimental`.
- **Why it hung instead of reporting that.** `handleFile` in `product-form.tsx` called
  `setUploading(false)` on the success path only, with no `try`/`catch`/`finally`. Any rejection
  therefore skipped both the reset and the error, leaving the field on "Uploading image..." forever —
  and because the file input is `disabled={uploading}`, the user could not even retry without
  reloading the page.

Fixed by the client's decision to make the interface promise match what the server will accept: the cap
is now **1 MB decimal** (`MAX_IMAGE_BYTES = 1000 * 1000`), deliberately below the 1 MiB request limit
so the multipart boundaries and part headers that travel with the file cannot push a request over it.
*(Superseded by Round 17, which restored the 5 MB cap by raising the request limit instead — the client
wanted the larger allowance.)*
`MAX_IMAGE_SIZE_LABEL` is exported so the action's message, the field's hint and the refusal copy all
read from one place; the file picker's `accept` list is derived from the server's allowed types rather
than a second hard-coded string; an oversized file is refused client-side before a byte is uploaded;
and `handleFile` gained the guard so any failure clears the spinner and says why. `next.config.ts` was
deliberately not changed.

Three checks encode what went wrong so it cannot return quietly: the cap must stay below the request
limit *with headroom*, the reset must live in a `finally`, and the size check must run before the
spinner starts. Both new guards were proved non-vacuous by restoring the old shapes — the 5 MB cap and
the success-path-only reset — and watching the intended failures appear, then reverting.

Four places still stated the old cap and were corrected: CLAUDE.md decision 2, DATABASE.md's storage
section, README.md's media paragraph, and D5 above.

**Round 17 — the client's second content pass.** Four changes from one message.

- **Upload allowance: 1 MB back to 5 MB, and the request limit raised to match.** Round 16 lowered the
  cap because Next's Server Action body limit defaults to 1 MiB; the client then asked for something
  between 1 and 5 MB, so the limit moves instead: `experimental.serverActions.bodySizeLimit: "6mb"` in
  `next.config.ts`, cap back at 5 MB, the extra megabyte as headroom for the multipart boundaries and
  part headers. `SERVER_ACTION_BODY_LIMIT_BYTES` now records the value we configure rather than Next's
  default, and the test reads `next.config.ts` and fails if the two disagree — the check that would
  have caught the original hang from the other direction.
- **The CMS states the resolution.** Every image field shows the recommended upload, derived from the
  display containers rather than invented: the carousel shows a 210px square and the product page a
  banner up to 1040px wide, centre-cropped, so the guidance is a 2000px square. The field also reports
  the dimensions of the file just chosen, read locally, and flags anything smaller than the
  recommendation. It deliberately does not read dimensions back off an already-uploaded image: that is
  rendered through `next/image`, which serves a resized copy, so `naturalWidth` would report the
  thumbnail rather than the original.
- **Every content block takes two images.** The per-position rule (`sectionImageSlots`) is gone,
  replaced by `SECTION_IMAGE_SLOTS = 2`. No schema or write-path change was needed — the images table
  is keyed by section and sort order, and `save_product_content()` walks however many images it is
  given — and the detail page already lays two out side by side. Recorded as a deliberate deviation
  from the frames, since the design gives only the first block two slots.
- **The hero video is wired to YouTube, behind a placeholder id.** `HeroVideoEmbed` creates the iframe
  on the client (YouTube wants the embedding origin and `window` does not exist while server
  rendering, so the origin is read through `useSyncExternalStore` rather than state set inside an
  effect), pairs `loop` with `playlist` because `loop=1` alone does not loop a single video, and
  autoplays muted and inline. Three consequences are recorded rather than discovered later: YouTube's
  own branding cannot be removed (`modestbranding` and `showinfo` are deprecated); the pause control is
  a design addition, required because an autoplaying loop running alongside other content needs a
  mechanism to stop it (WCAG 2.2.2, Level A); and a YouTube iframe letterboxes rather than filling the
  hero box on narrow screens. Visitors who asked for reduced motion get no autoplay at all — the play
  button is theirs. While the id is the placeholder, `HeroVideoSection` renders the poster state, so
  the hero is unchanged and nothing half-configured ships.

**Round 17, follow-up — the video id is a stand-in.** The client supplied a video, and a pre-flight
check of it (YouTube's oEmbed endpoint plus its watch page) returned *"Google AI Plans - Gemini Omni
Version 2 9x16"*, from **Google's own channel**, 30 seconds long. It is wired in so the embed can be
seen working, and recorded here as a stand-in rather than a decision: the content, the branding and the
framing belong to someone else, the accessible frame title names that video rather than pretending
otherwise, and restoring `PLACEHOLDER_ID` returns the poster state. A vertically framed clip in a
landscape hero box letterboxes heavily — a property of the stand-in, not of the finished hero. The
check itself is worth repeating for the real video: one request answers "does this id exist, is it
embeddable, and what is it actually?" before anything ships.

Two rendering details were verified rather than assumed. The server-rendered hero holds a pre-player
caption, not a frame, because the player is created on the client; the id reaches the browser inside
the RSC payload as a component prop, which is expected and not an iframe. And the caption is a plain
status rather than a button for everyone except reduced-motion visitors, so normal visitors are not
shown a control that dismisses itself when the player arrives — or, with JavaScript off, one that
would never work.

**Round 17, third follow-up — playback is scroll-driven, and the player chrome is off.** The client
asked for the video to be absent on load, to appear and play at a scroll position, and to pause once
it leaves the viewport.

- **Nothing on load.** The player is not created until the visitor has scrolled past ~120 px *and* the
  box is on screen. Verified in the built output: the server-rendered hero contains no player at all,
  only the poster caption. *(The thresholds described in this follow-up were replaced by the fourth
  follow-up below: the player is now created paused, and playback follows full visibility.)*
- **Two thresholds, not one.** A single visibility threshold would start and stop the video repeatedly
  as a visitor scrolled back and forth across it; the gap between playing at a half and pausing below a
  quarter is hysteresis.
- **The scroll threshold is load-bearing, not decoration.** The hero box sits inside the first screen
  on desktop and on mobile, so "play when visible" fires on load and is simply autoplay again. Nothing
  starts until the visitor has actually scrolled, which is what makes "hidden on load" true.
- **The early-mount step was dropped from the plan.** Mounting the player before it should play is
  possible, but a paused YouTube frame looks nothing like the poster it replaces, and a `playVideo`
  command sent before the player is listening is dropped. Creating it at the play moment needs neither
  trick: `autoplay=1` starts it, and by the time pause and resume need scripted control the player is
  loaded and listening.
- **Playback is derived, not stored** (`mounted && quarterVisible && !userPaused`). That keeps the
  hysteresis honest and the control's icon truthful — one source of truth for both — and it was forced
  by the lint rule against setting state inside an effect: the effect now only forwards the derived
  state to the player, which also means a pause the visitor chose can never be overridden by scrolling
  back.
- **The controls are hidden**, as asked. YouTube's own bar was already off (`controls=0`), and the
  pause control is now invisible until hover or keyboard focus. That is a scored trade, not a free
  one: WCAG 2.2.2 (Level A) still requires a mechanism to stop an autoplaying loop and one still
  exists, but it is no longer visible to a pointer user who wants to stop the video without reaching
  for the keyboard. Recorded in CLAUDE.md's known gaps.
- **The box itself is hidden on load too.** `ScrollReveal` renders it at `opacity: 0` with a 20px
  downward offset, and both animate away on the visitor's first scroll. A plain viewport reveal cannot
  do that: for an element already inside the first screen it fires at hydration, so "hidden until you
  scroll" would really mean "hidden until hydration" — a mount animation with extra steps. The new
  primitive pairs the viewport trigger with the scroll latch, and `once: true` on the in-view half
  makes the reveal one-way, so the box does not vanish again when the visitor scrolls back past it.
  Verified in the built markup: the box ships as `style="opacity:0;transform:translateY(20px)"` with
  `data-reveal`, which also means the root layout's no-JavaScript rule restores it instead of leaving
  a permanent hole.
- **One threshold, shared.** `components/motion/use-has-scrolled.ts` now owns both the latch and the
  120px figure, used by the reveal and by playback, so the box cannot appear and start playing at
  different moments. The consequence to be aware of: because the box sits inside the first screen, that
  area is unpainted on load until the visitor scrolls. There is no layout shift — the box still
  occupies its height — but it is blank in the meantime.

**Round 17, fourth follow-up — the paused video replaces the poster, and playback follows full
visibility.** Two corrections from the client after seeing the behaviour.

- **The poster is no longer what appears while scrolling.** It now belongs only to the states that
  genuinely have no player: a no-JavaScript visitor, who never gets one, and a reduced-motion visitor
  who has not pressed play. Once scrolling begins the poster is dropped, so what appears in the box is
  the video itself, paused, while the visitor scrolls it into view.
- **The player is created paused** (`autoplay=0`) at the same moment the box reveals — about a fifth of
  it on screen — and `playVideo` is sent only once the whole box is in frame. This is the early-mount
  step that was dropped from the plan earlier in this round, and it becomes right once the poster is
  gone: the paused frame is now the intended state rather than a flash to be avoided.
- **Playback follows full visibility**, replacing the 50 %/25 % hysteresis pair: play when the element
  is entirely on screen, pause on any scroll away from that, including out of view. A deliberate press
  of play still wins while the box is on screen at all, so the control cannot look broken when the box
  is not completely in frame.
- **A consequence worth stating.** On a window shorter than the box itself — under roughly 700 px tall
  on desktop, or a landscape phone — the whole box can never be in frame, so playback will not start
  on its own there. The control is still there, revealed on hover or keyboard focus, and the video
  pauses again as soon as it leaves that state.

**Verified**: 164 tests (6 new or rewritten), `npx tsc --noEmit`, `npm run lint` and `npm run build`
all exit 0, with `/` and `/products` still static and nine product pages prerendered. The hero's
rendered markup is byte-identical to before and contains no iframe while the id is a placeholder.

**Round 18 — the PANDORA showcase tiles carry images.** The client exported nine images into
`public/pandora-features-images` and asked the grid to use them. Each tile now renders one behind its
label, with the existing dark wash kept on top so the label stays legible, and a base surface
underneath that is what remains if an image cannot load.

- **The pairing is by shape, because nothing else can decide it.** The files are `pandora-1` …
  `pandora-9`, and their only metadata is `Software: Figma`; no document in the repository says which
  photograph belongs to which feature. What is knowable is the geometry, and it matches the grid
  exactly — two assets are twice as wide as they are tall, one is taller than wide, six are
  single-tile shaped, against two `lg:col-span-2` tiles, one `lg:row-span-2` tile and six singles. The
  remaining six fill the single tiles in filename order. A wrong pairing is one string per tile.
- **Measured rather than taken on trust.** The set was described as six squares, two doubles and one
  portrait. Measured from the PNG headers: the two wide assets are 2.15:1 and the portrait is 1:1.67,
  both as described — but the six "squares" are really 1.10–1.62:1. Against a single tile of about
  1.28:1, `object-cover` trims up to 21% from the widest of them (`pandora-7`) and under 7% from most.
  Recorded because that is the one asset most likely to lose content at its edges.
- **Decorative, deliberately.** The images are `alt=""` rather than described: the label beside each one
  already names the feature, and writing alt text for pictures nobody in this workspace can view would
  mean inventing it.
- **Pinned by a test.** Three checks keep the join honest — every image in the directory is used exactly
  once and nothing else is referenced, each tile's image shape matches its tile's span with the
  dimensions read from the PNG headers rather than hardcoded, and the images stay marked decorative with
  `object-cover`. The shape check is the one that matters: a swap would otherwise look perfectly correct
  in review while showing a portrait photograph in a landscape tile.

---

## Appendix A — Verification command cookbook

```bash
# types and lint (the DoD gates)
npx tsc --noEmit
npm run lint

# design drift: every hex literal must exist in DESIGN-REFERENCE.md §2
grep -rhoE '#[0-9a-fA-F]{6}' app components lib | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn

# confirm no invented roles/statuses/schema were introduced
grep -rnE 'admin|editor|viewer|published|draft|audit' app lib supabase

# confirm public reads do not depend on cookies (Phase 1 goal)
grep -rn "cookies()" lib app components

# confirm RLS is not blanket-permissive
grep -n "using (true)\|with check (true)" supabase/migrations/*.sql

# static vs dynamic route table (Phase 1/5 inference check)
npm run build
```

## Appendix B — Documentation drift register

| File | Drift | Action |
| --- | --- | --- |
| `STRUCTURE.md` | Describes `prisma/schema.prisma`, `app/(website)`, `lib/db`, `tests/` — none exist; Prisma is forbidden | Rewrite or delete (Phase 0) |
| `DATABASE.md` | Describes `User`/`Page`/`Media`/`AuditLog`; actual schema is `products` + `product_content_sections` | Rewrite or delete (Phase 0) |
| `BUSINESS_RULES.md` | Roles `CONTENT_EDITOR`/`CONTENT_MANAGER` + publish workflow + soft delete/audit/restore; contradicts CLAUDE.md `admin`/`editor`/`viewer`; nothing implemented | Resolve as D1 (Phase 0) |
| `CLAUDE.md` | Says route groups `(marketing)`/`(cms)`; actual groups are `(auth)`/`(cms)` with public routes at the app root. Also lists shadcn/ui, which is not installed (D4) | Correct the route-group line; record D4 |
| `docs/design/README.md` | Links `screenshots/`, which does not exist; describes exports that are absent | Resolve as D3 |
| `docs/design/FIGMA-MAPPING.md` | Says "no undocumented route exists except the `/cms` redirect" in one place and lists `/cms` as undocumented in another; consistent overall | Fine — keep |
| `FIGMA.md` | Lines 7–8 both labelled `Products/[Product]`; line 8 (`13:2821`) is the mobile frame | Fix labels (Phase 0) |
| Root `figma-landing.png`, `figma-landing-current.png` | Untracked, unnamed per convention, sitting outside `docs/design/` | Move and rename (Phase 0) |
| `AGENTS.md`, `ARCHITECTURE.md` | Deleted but unstaged; `ARCHITECTURE.md` content contradicted CLAUDE.md; `AGENTS.md` is regenerated by `next dev` | Commit the deletion or restore intentionally (Phase 0) |
| `.gitignore` | `.env*` also ignores the `.env.example` CLAUDE.md requires | Add `!.env.example` (Phase 0) |
| `README.md` | Still the untouched `create-next-app` boilerplate | Replace when a real readme is wanted |
