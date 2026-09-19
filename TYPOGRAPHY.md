# Typography

Part of the [Design System](./DESIGN_SYSTEM.md). Figma remains the source of
truth — this document reflects the type scale currently implemented in code
and should be kept in sync with it.

## Font Family

**Inter** (via `next/font/google`), loaded once in `app/layout.tsx` and
exposed as a CSS variable.

```ts
// app/layout.tsx
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
```

```css
/* app/globals.css */
@theme inline {
  --font-sans: var(--font-inter);
}
```

Fallback stack: `var(--font-inter), sans-serif`.

Do not import additional font families. If a design calls for a second
typeface, raise it against Figma and add it here first.

## Type Scale

| Token           | Size    | Tailwind class               | Typical use                                       |
| --------------- | ------- | ---------------------------- | ------------------------------------------------- |
| Display         | 40px    | `text-4xl lg:text-[40px]`    | Page hero headline (marketing landing)            |
| Display / small | 36px    | `text-4xl`                   | Section-level hero headline (404, smaller heroes) |
| H1              | 48–60px | `text-5xl lg:text-6xl`       | Product detail page title                         |
| H2              | 30px    | `text-3xl`                   | Major section headings                            |
| H3              | 24px    | `text-2xl`                   | Sub-section headings, card group titles           |
| H4              | 20px    | `text-xl`                    | Modal / form titles (e.g. CMS login)              |
| H5              | 18px    | `text-lg`                    | Card titles, CMS page titles                      |
| Body            | 16px    | `text-base`                  | Default body copy                                 |
| Body / small    | 14px    | `text-sm`                    | Secondary copy, nav links, form labels            |
| Caption         | 12px    | `text-xs`                    | Meta text, tags, footer links, table cells        |
| Micro           | 9–10px  | `text-[9px]` / `text-[10px]` | Dense CMS form fields, image-alt labels           |

Arbitrary pixel values (`text-[40px]`, `text-[10px]`, `text-[9px]`) are
existing exceptions tied to compact CMS layouts and one hero breakpoint —
prefer the standard Tailwind scale for any new UI and reserve arbitrary
values for cases the scale doesn't cover.

## Font Weight

| Weight   | Tailwind class  | Use                                           |
| -------- | --------------- | --------------------------------------------- |
| Semibold | `font-semibold` | Hero/section headlines, nav-adjacent emphasis |
| Bold     | `font-bold`     | Headings, buttons, CTAs, table headers, tags  |
| Medium   | `font-medium`   | Nav links, small emphasis text                |
| Normal   | (default)       | Body copy                                     |

Buttons and CTAs are always `font-bold text-xs` or `text-sm` depending on
size — see `components/ui/Button.tsx`.

## Line Height

| Token              | Tailwind class                                        | Use                                   |
| ------------------ | ----------------------------------------------------- | ------------------------------------- |
| Tight              | `leading-none`                                        | Large hero numerals/labels (404 code) |
| Snug/tight display | `leading-tight` / `leading-[1.08]` / `leading-[1.12]` | Hero and H2 headlines                 |
| Snug               | `leading-snug`                                        | Card titles/descriptions              |
| Body               | `leading-5` / `leading-6`                             | Paragraph copy                        |

## Letter Spacing

`tracking-[0.14em]` uppercase is reserved for small eyebrow/kicker labels
(e.g. the "404" label on the not-found page). Body and heading text use
default tracking.

## Color Pairing

Headings and primary text default to `--foreground` (`#3f3f46`), or `--heading`
(`#18181b`) / `#27272a` for higher-contrast headings. Muted/secondary text uses
`--text-muted` (`#71717a`) or `--text-subtle` (`#94a3b8`). Do not introduce
new text colors outside these tokens — see `DESIGN_SYSTEM.md` → Colors.

## Usage Rules

- Reuse the tokens above before introducing a new size, weight, or
  line-height combination.
- Arbitrary values (`text-[Npx]`) require a reason (dense CMS forms,
  pixel-exact Figma hero breakpoints) — don't use them as a shortcut around
  the scale.
- Keep responsive type changes to the documented breakpoints
  (`sm:`, `lg:`) already used across `app/(marketing)/page.tsx` and
  `app/(marketing)/products/page.tsx`.
