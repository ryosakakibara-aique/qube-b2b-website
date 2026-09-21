# QUBE B2B Website + CMS

A production website and a small administrative CMS for QUBE Smart Lockers: a public marketing site,
a product catalogue, and a CMS for managing product content.

Figma is the visual source of truth. The screen scope, architecture rules and definition of done
live in [CLAUDE.md](CLAUDE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and
[DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript and Tailwind CSS 4
- Supabase: PostgreSQL, Auth, Storage
- Deployed on Render, with the domain managed at GoDaddy — see
  [Deploying to Render](#deploying-to-render)

No other runtime dependencies. Prisma, a second database and a separate backend are explicitly out
of scope; shadcn/ui is documented in the stack but is not installed — see
[docs/DEVELOPMENT-PHASES.md](docs/DEVELOPMENT-PHASES.md) §1.1 (D4).

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Environment

Every variable the code reads is listed in [`.env.example`](.env.example). `.env.local` is
git-ignored and must never be committed.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **project** URL — not the Data API URL. Anything after the host is discarded, but copying `…/rest/v1/` is a common mistake that breaks every request |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous/publishable key; access is governed by RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for canonicals, Open Graph, JSON-LD and the sitemap |
| `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET` | Storage bucket for product imagery (default `product-images`) |
| `INQUIRY_WEBHOOK_URL` | Optional, **server-only**. Where to announce a new enquiry (Teams / Slack / Power Automate) |

There is no service-role key in this project, by design — nothing bypasses RLS.

### Supabase setup

1. Create a Supabase project.
2. Apply the migrations **in filename order, once each** — the Supabase SQL editor or the CLI both
   work:

   ```text
   supabase/migrations/001_products.sql
   supabase/migrations/002_publication_roles_media.sql
   ```

   `002` creates the staff roles, replaces the permissive policies from `001`, adds product
   publication, the section image galleries, the `product-images` Storage bucket, the contact
   enquiry table, and the `save_product_content()` write function.

3. Optionally load the development fixtures: `supabase/seed/001_products.sql`.
4. Restart the dev server. `/` and `/products` cache their rendered output for 5 minutes, so a page
   rendered before the schema existed can keep showing the "temporarily unavailable" notice until
   that window passes.
5. Create the first CMS user in **Authentication → Users**.
6. Approve that user. A new account grants nothing until it is approved — this is deliberate, so an
   open sign-up form cannot be used to read drafts or enquiries:

   ```sql
   update public.profiles set role = 'admin', approved = true where email = 'you@example.com';
   ```

   Both parts are required; setting the role alone has no effect. Until an account is approved,
   signing in redirects back to this page with an explanation rather than opening an empty CMS.
7. **Recommended:** turn off public sign-up (Authentication → Providers → Email → *Allow new users to
   sign up*). The CMS is internal, so accounts should be created by invitation.

### Roles

| Role | Can |
| --- | --- |
| `admin` | everything, including deleting products and managing profiles |
| `editor` | create, edit, publish and upload product media |
| `viewer` | read every product, including drafts; read enquiries |

Authorization is enforced server-side in `lib/auth/authorize.ts` and, decisively, by row level
security in the database. Client-side checks only shape the interface.

## Deploying to Render

The app runs as a long-lived Node server (`next start`), which suits its caching model: product pages
are prerendered with a 5-minute revalidation, and that cache lives in the instance.

1. **Create the service.** Render dashboard → **New → Blueprint** → point it at this repository.
   [`render.yaml`](render.yaml) already provides the build command (`npm ci && npm run build`), the
   start command (`npm start`) and a health check on `/robots.txt`.
2. **Fill in the environment** when the blueprint prompts. `NEXT_PUBLIC_*` values are inlined at
   **build** time, so they must be present before the first build — changing one later needs a
   redeploy, not just a restart.

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | the Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable/anon key |
   | `NEXT_PUBLIC_SITE_URL` | `https://business.qubesmartlockers.com` (pre-filled by the blueprint) |
   | `INQUIRY_WEBHOOK_URL` | optional — the Teams/Slack webhook |

   `.env.local` is git-ignored and is **not** deployed; secrets belong in the dashboard.
3. **Add the custom domain.** Render → the service → **Settings → Custom Domains** → add
   `business.qubesmartlockers.com`. Render gives a target hostname; in GoDaddy DNS add a **CNAME**
   record with host `business` pointing at it. TLS is issued automatically once DNS resolves.
4. **Update Supabase Auth.** Supabase → Authentication → **URL Configuration**: set the Site URL to
   `https://business.qubesmartlockers.com` and add it to the redirect allow-list. Otherwise
   confirmation and invitation e-mails point at localhost.
5. **Node version.** `package.json` requires Node `>=22.18.0` (the test runner executes TypeScript
   natively), and Render reads that to pick a compatible version.

Things worth knowing about this deployment:

- **CMS-uploaded imagery never touches Render.** Product images live in the public Supabase Storage
  bucket and load straight from it; the instance serves the repository's own assets and the HTML, CSS
  and JS.
- **A single instance is assumed.** The prerender cache is per instance, so running several would give
  each its own until the next revalidation. That is harmless at this size, and `revalidatePath` still
  refreshes whichever instance handled a save.
- **Free instances spin down** when idle: the next request is slow and the prerender cache is cold.
- **If `NEXT_PUBLIC_SITE_URL` is ever missing from a production build**, canonical URLs, Open Graph and
  the sitemap fall back to the production origin rather than localhost, and a warning is logged.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Node's built-in runner — no test framework dependency) |

`npm test` covers the logic that the CMS depends on without needing a database: the authorization
policy (`lib/auth/roles.ts`), form validation and limits (`lib/products/validation.ts`), row mapping
and the queries the data layer builds (`lib/products/repository.ts`, through an injected fake
client), the honest-failure semantics of public reads (`lib/products/queries.ts`), upload rules and
file-signature checks (`lib/media/storage.ts`), contact enquiry validation (`lib/leads/actions.ts`)
and canonical-origin resolution (`lib/site.ts`). Tests are TypeScript files run directly by Node,
with a small resolver hook (`tests/register-alias.mjs`) so the `@/` alias resolves.

## Routes

| Route | Notes |
| --- | --- |
| `/` | Public landing page |
| `/products` | Published product catalogue |
| `/products/[product]` | Product detail; unpublished or unknown slugs are not served |
| `/cms/login` | CMS sign in (`noindex`) |
| `/cms` | Redirect to `/cms/products` |
| `/cms/products` | Product list, publication switch, pagination |
| `/cms/create` | Create a product (saved as a draft) |
| `/cms/edit/[product]` | Edit a product and its content sections |
| `/cms/inquiries` | Contact-form submissions. **Administrators only** — the rows hold customer PII |

`/cms/*` is gated by `proxy.ts` (Next.js 16's request proxy, formerly `middleware.ts`) and fails
closed: if Supabase credentials are missing, the CMS is not reachable at all.

## Being notified about new enquiries

Every submission from a "Talk to an Expert" form is **stored first**, then optionally announced.
Because the row is written before anything else happens, a notification can never lose a lead — the
authoritative inbox is `/cms/inquiries` (administrators only); the page itself lives at
`app/(cms)/cms/inquiries/page.tsx`.

To turn the announcement on, set `INQUIRY_WEBHOOK_URL` in `.env.local` to any endpoint that accepts
a JSON `POST`.

The payload is a superset, so one endpoint shape serves every consumer:

- `text` — a ready-to-post summary, plus the individual fields (`name`, `email`, `company`,
  `location`, `message`, `sourcePath`) for a plain message action, Slack, or your own consumer.
- `attachments` — the legacy Office 365 connector shape, holding an Adaptive Card with the enquiry
  in it.

### Microsoft Teams (no domain, no third-party account)

1. In Teams, open the channel that should receive the leads.
2. Add the **Workflows** app and create a flow from the template **"Post to a channel when a webhook
   request is received"**.
3. Finish creating it and copy the **HTTP POST URL** it generates (it looks like
   `https://prod-…logic.azure.com/…` or `https://default….environment.api.powerplatform.com/…`).
4. Put that URL in `.env.local`:

   ```bash
   INQUIRY_WEBHOOK_URL=https://prod-00.westus.logic.azure.com/workflows/.../triggers/manual/paths/invoke?...
   ```

5. Leave the template's steps as generated. Its condition checks whether `attachments` is null, and
   because this payload always carries a card, it takes the branch whose **"Post card in a chat or
   channel"** action posts `item()?['content']` — that token is correct as-is.
6. Restart the dev server (or set the same variable in the Render dashboard — see
   [Deploying to Render](#deploying-to-render)) and submit the contact form.

If you would rather post plain text than a card, delete that card action and add **"Post message in
a chat or channel"** with **Message** set to the trigger's `text` field instead. Both work with the
same payload.

**Gotcha:** Power Automate only offers the trigger's fields as dynamic content *after* it has
received a request. If the field list is empty, send one enquiry (or POST any sample JSON to the URL)
and reopen the flow. Pasting this into the trigger's **Request Body JSON Schema** works too, and is
immediate:

```json
{
  "type": "object",
  "properties": {
    "text": { "type": "string" },
    "name": { "type": "string" },
    "email": { "type": "string" },
    "company": { "type": "string" },
    "location": { "type": "string" },
    "message": { "type": "string" },
    "sourcePath": { "type": "string" }
  }
}
```

An Adaptive Card field rejects anything that is not card JSON — `The specified Teams flowbot
message's message body is invalid JSON` means plain text was pasted where a card object belongs.

### Outlook e-mail instead

- **A transactional provider** (Resend, Postmark, SendGrid) is the least work: create an account and
  an API key, verify a sending domain (DNS records where the domain lives), then replace the webhook
  call in `lib/leads/notify.ts` with the provider's API. Deliverability is handled for you.
- **Microsoft Graph** avoids a third party but needs an Azure app registration with `Mail.Send` and
  admin consent, then the same function posts to Graph.
- **Supabase's own e-mail cannot be used** — it sends authentication mail only.

`INQUIRY_WEBHOOK_URL` is server-only and must never be renamed to `NEXT_PUBLIC_*`.

## How content works

Products hold their own copy plus an ordered list of content sections, and each section can carry a
gallery of images. `save_product_content()` writes a product and replaces its sections in a single
transaction, so a failed save cannot leave authored content destroyed. See
[DATABASE.md](DATABASE.md) for the schema and the RLS summary.

The public site reads through a cookie-free Supabase client (`lib/supabase/public.ts`) so marketing
routes stay static and cacheable; anything session-dependent uses the cookie-based client. Saves
revalidate the affected public paths.

Media uploads are restricted to PNG, JPEG and WebP, capped at 1 MB, and verified by file signature
rather than the browser-declared MIME type. The cap sits below Next's 1 MiB Server Action body
limit, which would otherwise reject the request before validation ran. SVG is refused deliberately.

## Project documentation

| File | Contents |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Requirements, architecture, rules, confirmed V1 decisions |
| [docs/DEVELOPMENT-PHASES.md](docs/DEVELOPMENT-PHASES.md) | Phased plan, verified baseline, decision register, QA evidence |
| [STRUCTURE.md](STRUCTURE.md) | Directory layout and conventions |
| [DATABASE.md](DATABASE.md) | Schema, roles, RLS, storage |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Figma → code rules |
| [TYPOGRAPHY.md](TYPOGRAPHY.md) | Type scale as implemented |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | Workflow rules (partly deferred, see the status note) |
| [FIGMA.md](FIGMA.md) | Figma node ids per screen |
| [docs/design/](docs/design/) | Figma reference pack: mapping, palette, geometry |

## Known gaps

- **Typography and copy are unverified against Figma.** The committed SVG exports were
  outline-converted, so font, size and weight cannot be checked. Re-export the frames as SVG with
  "Outline Text" disabled, or as PNG at 1x/2x.
- **`NEXT_PUBLIC_SITE_URL` must be set in production**, otherwise canonical URLs fall back to
  localhost (a warning is logged).
- **Contact enquiries have no rate limiting**; the form uses a honeypot only.
- **The product carousel has no visible controls.** Auto-advance respects `prefers-reduced-motion`
  and pauses on hover or focus, but a screen-reader user has no discoverable pause. Adding controls
  means adding UI the Figma frames do not define.
- **`BUSINESS_RULES.md`'s review workflow, audit log and soft delete are not implemented**; there is
  no delete affordance in the CMS, so no content can be destroyed from the interface.
