# STRUCTURE

Verified against the working tree. This replaces an earlier draft that described Prisma, a
`prisma/schema.prisma` file, `app/(website)`, `lib/db` and a `tests/` directory — none of which
exist, and Prisma is explicitly out of scope per [CLAUDE.md](CLAUDE.md).

```text
qube-b2b-website/
|
├── CLAUDE.md                      project contract
├── DESIGN_SYSTEM.md               Figma -> code rules
├── DEFINITION_OF_DONE.md          completion checklist
├── BUSINESS_RULES.md              workflow rules (partly deferred, see DATABASE.md)
├── DATABASE.md                    schema as implemented
├── TYPOGRAPHY.md                  type scale as implemented
├── FIGMA.md                       Figma node ids per screen
├── proxy.ts                       request proxy: session refresh + CMS auth gate (Next 16)
|
├── app/
│   ├── layout.tsx                 root layout, metadata base, Inter
│   ├── error.tsx                  route error boundary
│   ├── not-found.tsx              404
│   ├── robots.ts                  /robots.txt
│   ├── sitemap.ts                 /sitemap.xml (includes published products)
│   ├── globals.css                design tokens
│   ├── (marketing)/
│   │   ├── page.tsx               /
│   │   └── products/
│   │       ├── page.tsx           /products
│   │       └── [product]/
│   │           ├── page.tsx       /products/[product]
│   │           └── loading.tsx    loading state
│   ├── (auth)/
│   │   └── cms/login/page.tsx     /cms/login
│   └── (cms)/
│       ├── layout.tsx             CMS shell wrapper (session-aware)
│       ├── error.tsx              CMS error boundary (inside the shell)
│       ├── not-found.tsx          CMS 404 boundary
│       └── cms/
│           ├── page.tsx           /cms -> redirect to /cms/products
│           ├── loading.tsx        loading state for the CMS screens
│           ├── products/page.tsx  /cms/products
│           ├── inquiries/page.tsx /cms/inquiries (administrators only)
│           ├── create/page.tsx    /cms/create
│           └── edit/[product]/page.tsx  /cms/edit/[product]
|
├── components/
│   ├── ui/                        Button, Notice, Skeleton, RichText
│   ├── layout/                    SiteNav, SiteFooter, marketing sections
│   ├── marketing/                 ContactSection, ContactForm
│   ├── products/                  ProductCarousel
│   ├── cms/                       CmsShell, CmsHeader, ProductForm, PublishToggle, LoginForm
│   └── seo/                       JsonLd
|
├── lib/
│   ├── auth/
│   │   ├── roles.ts               role types + policy predicates (no I/O)
│   │   ├── session.ts             getSessionUser (reads Supabase)
│   │   └── authorize.ts           requireSession, requireEditor
│   ├── supabase/
│   │   ├── server.ts              cookie-based client (CMS, auth)
│   │   └── public.ts              cookie-free client (public reads)
│   ├── products/
│   │   ├── types.ts               Product + action state
│   │   ├── repository.ts          row mapping + client-injected queries
│   │   ├── queries.ts             public reads
│   │   ├── cms.ts                 CMS reads
│   │   ├── validation.ts          form contract + server-side validation
│   │   ├── richtext.ts            small markdown subset used by content bodies
│   │   ├── errors.ts              failure classification for reads
│   │   └── actions.ts             server actions: sign in/out, save, publish
│   ├── media/
│   │   ├── storage.ts             bucket, limits, signature checks
│   │   └── actions.ts             uploadProductImage
│   ├── leads/
│   │   ├── types.ts               enquiry state type + initial state (no "use server")
│   │   ├── queries.ts             admin-only enquiry reads
│   │   ├── notify.ts              optional webhook announcement (never throws)
│   │   └── actions.ts             submitContactEnquiry
│   ├── result.ts                  DataResult<T>, shared by every read
│   ├── format.ts                  CMS timestamp formatting
│   └── site.ts                    canonical origin helpers
|
├── docs/
│   ├── DEVELOPMENT-PHASES.md      plan + verified baseline
│   └── design/                    Figma reference pack (mapping, palette, geometry)
|
├── supabase/
│   ├── migrations/                001_products.sql, 002_publication_roles_media.sql
│   └── seed/001_products.sql      development fixtures
|
├── tests/                         node:test unit tests for pure logic
└── public/                        logos, section imagery
```

## Conventions

- Route groups are `(marketing)`, `(auth)` and `(cms)`, as CLAUDE.md prescribes. The group names
  never appear in URLs. Root-level files (`layout.tsx`, `error.tsx`, `not-found.tsx`, `robots.ts`,
  `sitemap.ts`) stay outside the groups because they apply to the whole app.
- Public reads go through `lib/supabase/public.ts` so marketing routes stay static and cacheable;
  anything session-dependent uses `lib/supabase/server.ts`.
- Server Actions live in `lib/*/actions.ts` with `"use server"`. Route Handlers are reserved for
  genuine HTTP contracts — there are none yet.
- Components with product logic live under `components/cms/`; the shell carries none.

## Tests

`npm test` runs Node's built-in test runner directly against TypeScript files — no test framework
dependency was added. `tests/register-alias.mjs` registers a resolver hook so Node understands the
`@/` alias from `tsconfig.json`; without it the modules that import through the alias could not be
loaded at all, and rewriting application imports to relative paths purely for tests would be the
wrong trade. `tsconfig.json` sets `allowImportingTsExtensions` so test files can import `../lib/…ts`
directly, which is what Node resolves.

Coverage: the authorization policy (`lib/auth/roles.ts`), the product form validation contract
(`lib/products/validation.ts`), row mapping and query construction for the data layer
(`lib/products/repository.ts`, exercised through an injected fake client), the honest-failure
semantics of public reads (`lib/products/queries.ts`), upload rules and file-signature checks
(`lib/media/storage.ts`), contact enquiry validation (`lib/leads/actions.ts`) and canonical-origin
resolution (`lib/site.ts`).

Anything needing a live database, a browser or the Next runtime (`next/headers` cannot be imported
outside it) is out of reach for this suite and is tracked under "Known gaps" in
[docs/DEVELOPMENT-PHASES.md](docs/DEVELOPMENT-PHASES.md).

## Deliberate deviations

- **`lib/` is organised by domain** (`products`, `media`, `leads`, `auth`, `supabase`) rather than
  a generic `lib/services/`. The architecture block in CLAUDE.md is a sketch; a domain folder keeps
  each entity's types, validation and queries together, and no service layer is shared between
  domains.
- **No root-level `types/` or `schemas/`.** With a single entity, its types (`lib/products/types.ts`)
  and validation (`lib/products/validation.ts`) belong beside it. They move out only when a second
  domain needs them.
- **`components/products/` and `components/seo/`** exist in addition to the documented
  `ui` / `marketing` / `cms` / `layout` groups, mirroring the domain split above.
