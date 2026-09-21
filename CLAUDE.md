# Project Development Guide

## Project
Website + CMS

This repository contains a production website and a small administrative CMS.

The implementation is **Figma-driven**. Figma is the visual source of truth.

## Confirmed V1 Screen Scope

### CMS
- `/cms/login` — Figma node `1:2265`
- `/cms/products` — Figma node `1:2316`
- `/cms/edit/[product]` — Figma node `1:2525`
- `/cms/create` — Figma node `1:2372`
- `/cms/inquiries` — added at the client's request; administrator-only list of contact-form
  submissions (it has no Figma frame)

### Public Website
- `/` — Figma node `1:1117`
- `/products` — Figma node `1:1926`
- `/products/[product]` — Figma node `1:2070`

There is **no separate `/cms/products/[product]` screen**. Product-specific CMS work is represented by `/cms/edit/[product]`.

Do not invent additional screens or features unless explicitly requested or required by an existing flow.

---

## Core Stack

- Next.js 16 / App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui — named in this stack, but deliberately **not installed** (D4: V1 needs no dialog,
  popover, sheet or tab; the primitives in `components/ui/` are hand-rolled)
- Motion (`motion`, the library formerly published as Framer Motion) — the public pages' motion
  system, and only there; see decision 12
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- GitHub
- Render (Node web service)
- GoDaddy-managed domain/DNS

### Explicit constraints

- Do not introduce Prisma.
- Do not introduce another database.
- Do not introduce a separate backend framework.
- Do not introduce microservices.
- Avoid global state libraries unless a concrete requirement exists.
- Prefer native Next.js/React/browser capabilities before adding dependencies.
- Keep the dependency footprint small.

---

## Development Principles

### 1. Figma first

Before implementing a UI element:

1. Inspect the relevant Figma frame/component.
2. Identify layout, typography, colors, spacing, states, and responsive behavior.
3. Reuse an existing code component when possible.
4. Implement the smallest reusable component that matches the design.

Do not redesign the Figma UI.

Do not invent design values when they can be determined from Figma.

### 2. Do not silently invent requirements

When requirements are ambiguous:

1. Check Figma.
2. Check repository documentation.
3. Check existing code.
4. Prefer the simplest interpretation consistent with the product.
5. If ambiguity materially changes architecture, data, security, or user flow, identify it before proceeding.

Clearly distinguish confirmed requirements from inference.

### 3. Keep architecture proportional

This is a small Website + CMS.

Prefer:
- simple data models
- simple server-side data access
- focused components
- minimal dependencies
- clear boundaries
- conventional Next.js patterns

Avoid abstraction for abstraction's sake.

---

## Application Architecture

```text
app/
├── (marketing)/
├── (cms)/
├── api/                 # only real HTTP contracts
├── globals.css
└── layout.tsx

components/
├── ui/
├── marketing/
├── cms/
└── layout/

lib/
├── auth/
├── supabase/
├── services/
├── content/
└── utils/

schemas/
types/
supabase/
public/
```

### Route groups

Use:
- `app/(marketing)` for public website routes
- `app/(cms)` for CMS routes

The route group names are organizational and do not appear in URLs.

### API

Do not create REST endpoints for every CRUD operation.

Prefer:

```text
CMS UI
  -> Server Action
  -> service/data layer
  -> Supabase
```

Use Route Handlers only for:
- external integrations
- webhooks
- public API contracts
- cases where an HTTP endpoint is genuinely required

---

## CMS App Shell

The CMS uses an App Shell.

The shell may contain:
- Sidebar
- Topbar
- Breadcrumbs
- Session/user controls
- Responsive navigation
- Main content layout
- Global CMS UI states

The shell must **not** contain product-specific business logic.

Keep CMS screens independently maintainable.

---

## Data Architecture

The CMS is content-first and domain-specific.

Current product scope centers on the Product entity required by the confirmed Figma screens.

Do not implement unrelated entities from older architecture proposals unless they are actually required by the current repository/Figma.

If later requirements introduce:
- pages
- case studies
- blog posts
- team members
- media
- settings

add them intentionally and only when required.

### Product data

Derive the minimum product schema from the Figma screens and actual content requirements.

Do not create a generic page builder or Webflow-like block engine.

Flexible JSON is acceptable only when:
- the content is genuinely variable,
- the shape is typed,
- validation exists,
- the structure is documented,
- a relational model would add unnecessary complexity.

---

## Authentication and Authorization

Use Supabase Auth.

Roles:
- `admin`
- `editor`
- `viewer`

Authorization must be enforced server-side and through Supabase RLS.

Client-side checks are only UX behavior.

Never trust client-provided role information.

---

## Media

Use Supabase Storage for CMS-uploaded media.

Do not commit CMS media to Git.

Use Next.js image optimization for public images where appropriate.

Media metadata should support accessibility, including meaningful alt text.

---

## SEO

SEO is part of the implementation, not a final patch.

Implement as appropriate:
- page titles
- meta descriptions
- canonical URLs
- Open Graph metadata
- sitemap
- robots.txt
- semantic HTML
- correct heading hierarchy
- image alt text
- clean URLs
- internal linking
- 404 handling
- redirects where required
- accurate structured data

Never use keyword stuffing.

---

## LLM / AI Discoverability

Treat AI/LLM discoverability as a first-class web-quality requirement.

Optimize for accurate understanding rather than manipulation.

Use:
- clear semantic HTML
- explicit headings
- concise, self-contained content sections
- consistent entity names
- clear descriptions of the company/products/services
- meaningful internal links
- stable canonical URLs
- server-rendered public content where appropriate
- accurate JSON-LD/schema markup where applicable

Relevant schema types may include:
- Organization
- WebSite
- WebPage
- Product
- Service
- BreadcrumbList

Only use schema types supported by the actual page content.

Do not:
- create AI-only pages
- cloak content
- stuff pages with artificial FAQs
- fabricate facts or structured data
- create duplicate machine-targeted content

The same information architecture should serve humans, search engines, AI systems, and accessibility technologies.

---

## Performance

Prefer:
- Server Components by default
- Client Components only when needed
- minimal JavaScript
- optimized images
- efficient Supabase queries
- appropriate caching/revalidation
- minimal third-party scripts
- minimal dependencies

Do not introduce complexity for theoretical optimization.

---

## Accessibility

Definition of done includes:
- semantic HTML
- keyboard navigation
- visible focus states
- proper form labels
- accessible dialogs and menus
- sufficient contrast
- meaningful link/button labels
- screen-reader-friendly state changes
- reduced-motion consideration where appropriate

Use ARIA only when necessary.

---

## Visual QA

Visual QA is continuous.

For each major component/screen:

```text
Figma
  -> Implement
  -> Compare
  -> Correct
  -> Approve
```

Check:
- desktop
- mobile
- typography
- spacing
- layout
- colors
- imagery
- states
- responsive behavior

Do not wait until the end of the project.

---

## Definition of Done

A feature is complete only when:

### Design
- Matches Figma
- Responsive
- Correct states
- Correct typography/spacing/colors

### Functionality
- Happy path works
- Validation works
- Loading/empty/error states work
- Success feedback works where appropriate

### Engineering
- TypeScript passes
- Lint passes
- Tests/checks pass where applicable
- No duplicate implementation
- No console errors

### Security
- Auth enforced
- Authorization enforced server-side
- RLS configured
- Secrets protected

### Web quality
- SEO implemented
- Accessibility implemented
- Performance reviewed
- AI/LLM discoverability requirements addressed

---

## AI Coding Agent Rules

This project may be developed with DeepSeek or another coding agent.

The coding agent must:
- inspect existing files before changing them
- preserve working code unless a change is necessary
- avoid broad rewrites
- avoid speculative features
- avoid unnecessary dependencies
- report meaningful architectural changes
- keep commits focused
- never expose secrets
- never fabricate Figma requirements

When modifying an existing feature, prefer a small targeted change over a rewrite.

When a dependency is proposed, explain why existing project capabilities are insufficient.

---

## Implementation Order

### Phase 1 — Foundation
- verify current repository
- verify Figma mappings
- establish design tokens
- establish Supabase connection
- establish auth/RLS
- establish shared UI primitives

### Phase 2 — Shells
- marketing shell
- CMS App Shell
- navigation
- responsive behavior

### Phase 3 — CMS vertical slice
- login
- product listing
- product creation
- product editing

### Phase 4 — Public website
- landing page
- product listing
- product detail

### Phase 5 — QA
- functional
- visual
- responsive
- accessibility
- security
- SEO
- AI/LLM discoverability
- performance

Do not implement unrelated future CMS modules.

---

## Git Rules

Never commit:
- `.env`
- secrets
- API keys
- database credentials
- build artifacts
- CMS-uploaded media

Maintain `.env.example`.

Keep commits focused and descriptive.

---

## Confirmed V1 Decisions

Recorded because the documentation either conflicted with itself or was silent, and these were
decided explicitly rather than inferred. Full register: [docs/DEVELOPMENT-PHASES.md](docs/DEVELOPMENT-PHASES.md) §1.

1. **Roles and workflow.** This file's `admin` / `editor` / `viewer` govern. Product publication is
   a single `published` boolean, driven by the toggle in the CMS product list; the public site reads
   published products only. `BUSINESS_RULES.md`'s Draft → Review → Published workflow, audit log and
   soft delete are deferred — see the status note at the top of that file.
2. **Media.** Product imagery is uploaded to the Supabase Storage bucket `product-images` (public
   read, `admin`/`editor` write, PNG/JPEG/WebP, **1 MB cap**, verified by file signature). The cap was
   originally 5 MB, which was unreachable: Next refuses a Server Action request body over 1 MiB
   (`next.config.ts` does not raise `experimental.serverActions.bodySizeLimit`), so a larger image was
   rejected *before* validation ran, and the upload field — which reset its "uploading" state only on
   success — appeared to hang. SVG is refused deliberately.
3. **Contact enquiries.** The three "Talk to an Expert" forms submit to `public.contact_submissions`
   (anonymous insert; **only `admin` may read**, since these rows hold customer PII). They are read
   at `/cms/inquiries`. No CRM integration exists; an optional notification webhook is described in
   [README.md](README.md).
4. **Content sections are data-driven.** The create screen shows three content blocks, but designed
   product pages render more than three, so the CMS manages a variable number of sections. A fixed
   count would delete authored content on save.
5. **`/cms` is a documented redirect** to `/cms/products`.
6. **The primary CTA label is dark, not white.** Labels on the brand gradient use
   `--brand-foreground` (`#18181b`), which measures 6.62–7.69:1 across the gradient stops and passes
   WCAG AA; white measured 2.30–2.68:1 and failed at every text size. The client confirmed this
   change.
7. **An account is not staff by default.** `profiles.approved` defaults to `false` and
   `current_user_role()` returns a role only for approved accounts, so public sign-up cannot be used
   to read unpublished drafts or customer enquiries. Both the role and the approval flag must be set
   deliberately. Public sign-up should also be disabled on the project.
8. **The product detail page is entirely CMS-driven.** Every word on it comes from the product
   record — title, description, facts, content-section headings, bodies and images. There is no
   hardcoded product copy, so the same template serves any product a CMS user creates. The only
   fixed copy is shared site chrome (the enquiry section, success stories, related products and
   footer), which is identical on every marketing page.
9. **Rich text is a deliberately small markdown subset** — `**bold**`, `*italic*` and `- list` —
   stored as ordinary text and rendered to React elements, never to raw HTML. There is no HTML
   input and therefore no sanitizer to get wrong: content stored in the database can never execute
   or inject markup. Unknown markdown is literal text.
10. **Enquiries are stored before anything else happens.** A notification is best-effort: it runs
    only after the row is written, is never allowed to throw, and is off unless
    `INQUIRY_WEBHOOK_URL` is set. A failed or slow notification therefore cannot lose a lead, which
    is why the inbox is `/cms/inquiries` rather than the notification.
11. **Hosted on Render at `business.qubesmartlockers.com`.** This replaces the Vercel entry that was
    in the Core Stack. The deployment contract lives in [`render.yaml`](render.yaml) and
    [README.md](README.md); `NEXT_PUBLIC_SITE_URL` is that origin, set at build time, which closes
    the canonical-hostname question. CMS-uploaded imagery is served from Supabase Storage rather than
    the instance.
12. **Motion is a client decision, not a design one (D9).** The design specifies no animation — no
    duration, easing or transition exists in any frame — so the motion system is an addition, and it
    is confined to the marketing routes: reveals and micro-interactions only, with no ambient
    lighting, particles, rotation, pointer tracking or parallax, because those are new visual design
    rather than motion. It lives in `components/motion/` (one tokens module, one variants module, two
    primitives, one provider mounted by `app/(marketing)/layout.tsx`), pages compose its variants
    rather than writing transitions inline, and `MOTION_ENABLED` turns all of the motion off at
    runtime — behaviour only: the vendor chunks still load, because a runtime constant cannot remove
    an import, so reclaiming the bytes means reverting the dependency. The hero cascades in over
    ~630 ms, heading first, and **the heading fade is the accepted largest-contentful-paint cost**:
    it is the measured element, so it takes the shortest duration in the system and no delay at all
    (`heroHeading()` accepts no index, which makes that structural). The measured cost
    is ~32 KB gzipped of vendor JavaScript per marketing page — more than the library documents, which
    is recorded rather than glossed. Full rationale: [docs/DEVELOPMENT-PHASES.md](docs/DEVELOPMENT-PHASES.md) §1.1 (D9) and Round 14.

### Known gaps

- **Typography is unverified.** The Figma SVG exports were outline-converted, so font family, size,
  weight and leading cannot be checked against the design. Inter is the current choice, not a
  verified one.
- **`docs/design/screenshots/` does not exist**, so the frames those docs reference cannot be read.
  Re-export PNG (1x/2x), or SVG with "Outline Text" disabled, to close this and the gap above.
- **The mobile layout is inferred, not designed.** Only desktop frames are readable, so the collapsed
  navbar, the H1 leading/tracking below `lg`, the section padding and the 16px form inputs come from
  the existing tokens plus the client's mobile spot-test notes rather than from a mobile frame. Each is
  a single class or one `globals.css` rule, so a corrected mobile export replaces them cheaply.
- **The motion system is unverified as an experience.** There is no browser in this workspace, so the
  reveals, the hover and press feedback and the reduced-motion behaviour are unit- and build-verified
  only; they need the client's device. The vocabulary is deliberately small for that reason.
  `MOTION_ENABLED = false` removes every animation at runtime and was verified by building with it
  off; it does not remove the JavaScript.
- **Motion costs ~32 KB gzipped per marketing page**, measured from the build, against the ~20 KB its
  documentation predicts for this configuration. If that trade is rejected, the reveals become CSS
  transitions driven by one `IntersectionObserver` for under 2 KB; see D9.
- **The hero fade is a deliberate LCP cost.** The heading on `/` and `/products` fades in, and text at
  `opacity: 0` is not a valid LCP candidate, so the metric lands when the 260 ms fade ends rather than
  at first paint. The client asked for the fade knowing that; if it is ever walked back, the heading
  returns to transform-only first (Round 14 follow-up).
- **Footer link labels** are not recoverable from the reference pack. The footer renders navigation
  targets that are known to exist rather than placeholder link text.
- **Success-story CTAs** have no destination: no stories route is in the confirmed scope, so every
  card points at `href: "#"` and its "Read Story →" arrow is part of the card's link rather than a
  control of its own. Per-card redirection, and whether that arrow becomes separately clickable, is the
  next task at the client's request. The cards keep their own dataset — stories, not the client list in
  `components/layout/client-logo-grid.tsx` — even though the same eight logo files appear in both.
