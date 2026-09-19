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

**Status: D1, D4, D5 and D8 are resolved** (see §1.1). D2, D3, D6 and D7 still need an input from
the client or an operator.

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

---

## 1.1 Resolution status

| ID | Outcome |
| --- | --- |
| **D1** | **Resolved by client decision — hybrid.** CLAUDE.md's `admin` / `editor` / `viewer` govern; publication is a single `published` boolean toggled from the CMS list; the public site reads published rows only. Draft→Review→Published, audit log and soft delete are deferred, and no delete affordance is exposed, so nothing is destroyed from the UI. Implemented in `supabase/migrations/002_*.sql`. |
| **D2** | **Still open — needs a Figma re-export.** Nothing in the repository can resolve typography against the design. [TYPOGRAPHY.md](../TYPOGRAPHY.md) now documents the scale actually implemented, which is derived from code and explicitly not a Figma verification; no type tokens were invented. |
| **D3** | **Still open.** `docs/design/screenshots/` is absent. The extracted palette/geometry JSON was sufficient for colour and shape work; typography and copy are not recoverable this way. |
| **D4** | **Resolved by engineering judgement — do not install shadcn/ui yet.** CLAUDE.md mandates a small dependency footprint, and V1 needs no dialog, popover, sheet or tab. The one table is native `<table>`; the switch is a native button with `role="switch"`. Revisit when a real primitive is required. |
| **D5** | **Resolved by client decision — build the upload.** Bucket `product-images`, public read, `admin`/`editor` write, PNG/JPEG/WebP, 5 MB cap, signature-verified. SVG refused on purpose. |
| **D6** | **Resolved.** The site is hosted on Render at `business.qubesmartlockers.com`. That origin is the documented value for `NEXT_PUBLIC_SITE_URL` and is pre-filled in `render.yaml`; a production build missing the variable now falls back to the production origin rather than localhost, with a warning. The CMS form's hardcoded `business.qubesmartlockers.com/` path prefix is therefore confirmed correct rather than assumed. |
| **D7** | **Resolved.** The client created the Supabase project, applied both migrations, added an approved user and published a product, so the application now runs against real data. The authenticated write path is exercised through the CMS UI rather than the API here, because no service-role credential exists in this workspace by design. |
| **D8** | **Resolved by client decision — capture enquiries.** `public.contact_submissions` with anonymous insert and admin-only read, submitted through a validated server action with a honeypot. No CRM or e-mail integration. Live-verified: an anonymous insert returns 201, and an anonymous read returns zero rows. |

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
  type/signature mismatch, truncated payloads, a RIFF container that is not WebP, the 5 MB cap and
  the bucket env override.
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
  on scroll; and all scroll-triggered animations, which the client placed after the mobile pass
  (Round 13). Also deferred: the Figma reference exports (D2/D3). The canonical hostname (D6) closed
  in Round 12.

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
