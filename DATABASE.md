# DATABASE

Supabase PostgreSQL. Schema lives in [`supabase/migrations/`](supabase/migrations/); development
fixtures live in [`supabase/seed/`](supabase/seed/).

Applied migrations:

| File | Adds |
| --- | --- |
| `001_products.sql` | `products`, `product_content_sections` |
| `002_publication_roles_media.sql` | `profiles` + roles, product publication, section image galleries, Storage bucket, `contact_submissions`, `save_product_content()` |

This file describes what exists. It is not a proposal — the older `User` / `Page` / `Media` /
`AuditLog` draft was removed because none of those entities are required by the confirmed screens.

---

## Roles

`public.user_role` is an enum: `admin`, `editor`, `viewer`.

| Role | Can |
| --- | --- |
| `admin` | everything, including deleting products, managing profiles and reading enquiries |
| `editor` | create, edit, publish, and upload product media |
| `viewer` | read every product, including drafts |

- Stored in `public.profiles` (one row per `auth.users` row, created by the
  `on_auth_user_created` trigger).
- **An account is not staff by default.** `profiles.approved` defaults to `false`, and
  `public.current_user_role()` returns the role only for approved rows — so a new account, including
  one created through public sign-up, resolves to *no role* and is subject to the same rules as an
  anonymous visitor. Access is granted explicitly:

  ```sql
  update public.profiles set role = 'admin', approved = true where email = 'you@example.com';
  ```

  Both parts are required: setting the role without `approved = true` grants nothing.
- `public.current_user_role()` is `security definer` so policies on other tables can call it
  without recursing through the `profiles` policies.
- Role information is never taken from the client.
- **Recommendation:** disable public sign-up in the Supabase project (Authentication → Providers →
  Email → *Allow new users to sign up*). The approval gate above is defence in depth, not a
  substitute for keeping an internal CMS invite-only.

## products

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | primary key |
| `title` | `text` | required |
| `slug` | `text` | required, unique; the public path segment |
| `description` | `text` | required |
| `tags` | `text[]` | defaults to `{}` |
| `image_url`, `image_alt` | `text` | product image and its alt text |
| `acquisition`, `locations`, `cta_label` | `text` | Figma form fields |
| `published` | `boolean` | default `false`; the public site only ever reads published rows |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` maintained by trigger |

## product_content_sections

Ordered content blocks (`sort_order`), unique per product.

| Column | Type |
| --- | --- |
| `id` | `uuid` |
| `product_id` | `uuid` → `products.id`, cascade delete |
| `sort_order` | `integer` |
| `heading`, `body` | `text` |

`body` holds a small markdown subset (`**bold**`, `*italic*`, `- list`); see
[`lib/products/richtext.ts`](lib/products/richtext.ts). It is stored as plain text and rendered to
React elements, never to raw HTML, so no sanitizer is involved.

The number of sections is not fixed. The Figma create screen shows three blocks, but a designed
product page renders more than three service blocks, so the CMS supports a data-driven count and
the write path replaces exactly what it is given.

## product_content_section_images

Image gallery per section (the first content block accepts two images in the Figma form).

| Column | Type |
| --- | --- |
| `id` | `uuid` |
| `section_id` | `uuid` → `product_content_sections.id`, cascade delete |
| `sort_order` | `integer`, unique per section |
| `url` | `text` |
| `alt` | `text` |

## contact_submissions

Enquiries from the public "Talk to an Expert" forms.

| Column | Type |
| --- | --- |
| `id` | `uuid` |
| `name`, `email` | `text` (required) |
| `company`, `location`, `message` | `text` |
| `source_path` | `text` — the page the enquiry came from |
| `created_at` | `timestamptz` |

Anonymous visitors may insert; only staff may read. There is no rate limiting yet.

## Row level security

Every table has RLS enabled. Summary:

- **products** — anonymous/authenticated may select `published = true`; staff (all roles) may read
  all rows; `admin` and `editor` may insert/update; only `admin` may delete.
- **sections and section images** — publicly readable only while their parent product is published,
  so a draft cannot be read straight from the REST API; staff may read all; `admin`/`editor` may
  write.
- **profiles** — a user may read their own row; `admin` manages all.
- **contact_submissions** — anonymous insert; **only `admin` may read.** These rows hold customer
  names, e-mail addresses and messages, nothing in the CMS displays them yet, and keeping the
  readable surface as small as possible limits exposure if sign-up is ever left open.
- **storage.objects** — public read of the product image bucket; `admin`/`editor` may write.

## Storage

Bucket `product-images` (public read). Bucket name is overridable with
`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET`. Uploads are restricted to PNG, JPEG and WebP, capped
at 5 MB, and verified by file signature rather than the client-declared MIME type. The cap is enforced
inside the action, and the request carrying it is only allowed through because `next.config.ts` raises
the Server Action body limit to 6 MB — at Next's 1 MiB default a larger image was refused before
validation and the upload field appeared to hang (CLAUDE.md decision 2). A square of around 2000 px is
the recommended upload, since the product page shows the same file as a banner up to 1040 px wide,
centre-cropped. SVG is refused deliberately. Superseded files are not deleted; orphan cleanup is not
implemented.

## save_product_content()

```
save_product_content(
  p_id uuid, p_title text, p_slug text, p_description text, p_tags text[], p_image_url text,
  p_image_alt text, p_acquisition text, p_locations text, p_cta_label text, p_published boolean,
  p_sections jsonb
) returns uuid
```

Creates or updates a product and replaces its content sections in a single transaction.
`security invoker`, so RLS still applies to the caller. This exists because a delete-then-insert
performed as separate HTTP calls could fail halfway and destroy authored content.

## Not implemented

`BUSINESS_RULES.md` describes a Draft → Review → Published workflow, an audit log, and soft delete
with restore. These are **out of V1 scope** by decision; the schema has no `status` column, no
audit table, and no `deleted_at`. The `published` boolean is the only publication state.
