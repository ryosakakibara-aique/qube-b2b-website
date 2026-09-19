# Design Reference Pack

Durable reference extracted from the Figma SVG exports, so that Figma values can be checked
without re-opening Figma. **Generated once; the design is not expected to change during the
current implementation round.**

Source: Figma file `0vnDTxLADkHwJiaD6MplU3` ("QUBE B2B Website + CMS"), 10 frames, exported
as SVG into [`screenshots/`](screenshots/).

Machine-readable companions:

- [`design-measurements.json`](design-measurements.json) — curated palette, frames, components,
  conformance report
- [`design-geometry.json`](design-geometry.json) — every `<rect>` in every frame (x, y, w, h, rx,
  fill; gradient references resolved to stop colors)
- [`design-pathboxes.json`](design-pathboxes.json) — bounding box + fill for every `<path>`
  (approximate: parsed from coordinates, so bezier control points can overstate the box slightly)

These three files capture the color and geometry content of the SVG exports. **The
`screenshots/` folder is therefore reproducible/redundant for color and geometry purposes** —
it can be deleted without losing the extracted reference, and re-exported from Figma if the
originals are ever needed again.

---

## Read this first: what this pack can and cannot tell you

This matters because a reference pack that looks authoritative but silently lacks half the
design system is worse than no pack at all.

| Design dimension | Available? | Why |
| --- | --- | --- |
| Exact color values | ✅ **Complete** | Every fill/stroke is a literal hex in the SVG |
| Geometry (x/y/w/h, radii) | ✅ **Complete** | Every `<rect>` exposes exact coordinates |
| Section heights, container widths | ✅ **Complete** | Recoverable from the frame `viewBox` and rect positions |
| **Typography (family, size, weight, leading, tracking)** | ❌ **Absent** | Figma outline-converted all text to `<path>` |
| **Copy text content** | ❌ **Absent** | Same reason — glyphs are outlines, not characters |
| Visual/layout judgment | ❌ **Absent** | Requires rendered pixels and an image-capable model |

Verified: across all 10 files there are **zero** `<text>`, `<tspan>`, `<foreignObject>`,
`font-family`, or `font-size` occurrences. Every label, heading, and paragraph is an outlined
path. So this pack can confirm *where* something sits and *what color* it is, but never
*what it says* or *what typeface it uses*.

**Consequence:** the typography half of DESIGN_SYSTEM.md's Figma→Code checklist remains
unverified. `app/layout.tsx` loads **Inter**; nothing here can confirm or refute that choice.

---

## 1. Screen inventory — node correspondence confirmed

Each SVG carries its source Figma node ID inside its `clip-path`/`mask` identifiers
(e.g. `clip0_1_2265` → node `1:2265`), which confirms the mapping authoritatively.

| Node | Route | File | Size | Variant |
| --- | --- | --- | --- | --- |
| `1:1117` | `/` | `landing page.svg` | 1440×7054 | desktop |
| `1:556` | `/` | `landing page - mobile.svg` | 402×9858 | mobile |
| `1:1926` | `/products` | `products.svg` | 1440×2575 | desktop |
| `8:1602` | `/products` | `products - mobile.svg` | 402×4231 | mobile |
| `1:2070` | `/products/[product]` | `product-{product}.svg` | 1440×5935 | desktop |
| `13:2821` | `/products/[product]` | `product-[product] - mobile.svg` | 402×8535 | mobile |
| `1:2265` | `/cms/login` | `cms-login.svg` | 1440×1024 | desktop |
| `1:2316` | `/cms/products` | `cms -products.svg` | 1440×1024 | desktop |
| `1:2372` | `/cms/create` | `cms-create.svg` | 1440×2239 | desktop |
| `1:2525` | `/cms/edit/[product]` | `cms-edit-product.svg` | 1440×3087 | desktop |

All 10 nodes listed in [FIGMA.md](../../FIGMA.md) are present and self-identifying.

### Coverage gap against the documented scope

[CLAUDE.md](../../CLAUDE.md) declares **7** screens and documents only desktop nodes. These
exports contain **10** frames — the 3 extra are mobile variants (`1:556`, `8:1602`, `13:2821`)
that CLAUDE.md does not mention. They are legitimate parts of the design, and responsive
behaviour is a stated requirement, so the documented scope is incomplete rather than wrong.

---

## 2. Color palette — 30 colors, complete

Occurrence counts reflect sprite-like repetition in the SVG, so read them as *relative weight*,
not element counts.

### Neutrals (24 colors)

| Color | Count | Role |
| --- | --- | --- |
| `#27272A` | **871** | Dominant dark — the primary dark surface on public pages |
| `#3F3F46` | 273 | CMS dark (buttons, admin chrome) |
| `#E2E8F0` | 156 | Input fields, image placeholders |
| `#F1F5F9` | 144 | Page background |
| `#CBD5E1` | 93 | Strong borders |
| `#E5E7EB` | 91 | Subtle borders |
| `#111827` | 85 | Public-page dark text |
| `#6B7280` | 76 | Muted text |
| `#18181B` | 65 | Dark cards (success stories) |
| `#D1D5DB`, `#374151` | 26 each | Borders / secondary text |
| `#94A3B8` | 22 | Placeholder text |
| `#FEFEFE` | 18 | Near-white |
| `#323238` | 16 | CMS logo fill |
| `#71717A` | 13 | Muted text |
| `#9E9E9E` | 12 | Stroke |
| `#9CA3AF` | 6 | Tertiary text |
| `#52525B` | 5 | Secondary text |
| `#424242`, `#F9FAFB`, `#212121`, `#111114` | 2 each | Play button, near-white, misc |
| `#262626`, `#A1A1AA` | 1 each | Single-use |

### The brand accent is a GRADIENT, not a solid color

```
#00C290  →  #0FB8AA  →  #1FADC5      (341 occurrences each; 357 gradient definitions)
```

Three stops, appearing 341 times each across the exports. This is the single most important
fact in this pack, and it drives the critical finding in section 4.

### Two other accents

- `#0F766E` — a single dark teal occurrence. Distinct from the code's `#0E8E8F`.
- `#F1D7D9` / `#F8EDF0` — a pale pink, 22 and 4 occurrences, appearing **only** in the two
  product-page frames (`1:1926`, `1:2070`). Completely absent from the implementation.

---

## 3. Geometry and shape

### Radii

Measured radii carry Figma's half-pixel stroke/vector insets, so they cluster around clean
integers. Match to the clean value:

| Measured (count) | Intended | Code equivalent |
| --- | --- | --- |
| `11.5` (140), `12` (40) | **12** | `rounded-xl` — controls, inputs, buttons |
| `15.5` (1), `16` (20) | **16** | small cards, image tiles |
| `20` (17) | **20** | medium cards → `rounded-[20px]` |
| `24` (2) | **24** | circular icons (48/2) |
| `29.5` (7), `30` (35) | **30** | large section shells → `rounded-[30px]` |
| `31.5` (28), `32` (1) | **32** | hero/panel shells → `rounded-[32px]` |
| `7.75` (50) | **8** | small chips |
| `6.2` (120), `6` (11), `6.975` (24) | **6–7** | tags, tiny chips |

The implementation's four arbitrary radius values (`20px`, `28px`, `30px`, `32px`) sit inside
this set — `rounded-[28px]` is the outlier, close to measured 28.35.

### Confirmed component measurements

Cross-checks that validate this extraction method against already-read code:

| Component | Design (measured) | Code | Status |
| --- | --- | --- | --- |
| CMS primary button (`1:2265`) | 98×32, `rx=12`, `#3F3F46` | `bg-[#3f3f46]`, `rounded-xl` | ✅ match |
| Text input (`1:2265`) | 299×35, `rx=11.5`, `#E2E8F0` | `.cms-input`, `rounded-xl` | ✅ match |
| Hero video box (`1:556`) | 370×240, `rx=32` | `rounded-[32px]` | ✅ match |
| Play button (`1:556`) | 48px circle, `#212121` | `h-12 w-12`, `bg-[#212121]` | ✅ match |

---

## 4. Critical finding: the primary CTA is the wrong color

The four primary CTA buttons in frame `1:1117` are **all gradient-filled**, not solid:

| Position | Size | Radius | Fill |
| --- | --- | --- | --- |
| x=1077, y=20 | 163×32 | 12 | `#00C290 → #0FB8AA → #1FADC5` |
| x=200, y=304 | 163×44 | 12 | `#00C290 → #0FB8AA → #1FADC5` |
| x=638.5, y=4577 | 163×44 | 12 | `#00C290 → #0FB8AA → #1FADC5` |
| x=248, y=6563 | 163×44 | 12 | `#00C290 → #0FB8AA → #1FADC5` |

Every one resolves to the same three-stop brand gradient. Verified by resolving each
`url(#paintN_linear_1_1117)` reference to its `<linearGradient>` definition.

**The implementation paints them solid `#10B9B8`, which appears in none of the 10 frames.**

This is self-contradictory within the codebase: `product-carousel.tsx`,
`parallax-features-section.tsx`, and `success-stories-carousel.tsx` **already use the correct
gradient**, while every `Talk to an Expert` CTA uses the invented solid. The correct value was
known and applied in some places and not others.

Affected locations (9 occurrences of `#10b9b8`, 4 of `#0e8e8f`):

| File | Lines |
| --- | --- |
| `components/layout/site-nav.tsx` | 50 |
| `components/ui/Button.tsx` | 7 (`accent` variant) |
| `app/page.tsx` | 69, 75, 121, 183 |
| `app/products/page.tsx` | 31, 37, 96 |
| `app/products/[product]/page.tsx` | 136, 194, 257 |
| `app/globals.css` | 52 (`.landing-input:focus` ring) |

### Full conformance diff

**Invented — present in code, absent from all 10 frames (34 occurrences):**

| Color | Count | Role | Nearest design color | Priority |
| --- | --- | --- | --- | --- |
| `#DBE3EC` | 18 | Marketing section/panel borders | `#CBD5E1` or `#E5E7EB` | high |
| `#10B9B8` | 11 | Primary CTA fill + focus ring | brand gradient | **critical** |
| `#0E8E8F` | 3 | Accent text ("PANDORA 3.0") | `#0F766E` | medium |
| `#FFFFFF` | 2 | Text on dark buttons | `#FEFEFE` | low |

**Confirmed — in code and in the design (16 colors):** `#71717A`, `#E2E8F0`, `#F1F5F9`,
`#3F3F46`, `#00C290`, `#27272A`, `#CBD5E1`, `#0FB8AA`, `#1FADC5`, `#18181B`, `#E5E7EB`,
`#94A3B8`, `#52525B`, `#424242`, `#212121`, `#A1A1AA`.

**Design colors never used in code (14):** `#0F766E`, `#111114`, `#111827`, `#262626`,
`#323238`, `#374151`, `#6B7280`, `#9CA3AF`, `#9E9E9E`, `#D1D5DB`, `#F1D7D9`, `#F8EDF0`,
`#F9FAFB`, `#FEFEFE`.

Note `#27272A` — the **single most-used color in the design (871 occurrences)** — appears only
12 times in code, and `#3F3F46` is used as `--accent` despite being the CMS neutral. The token
layer's semantic naming does not reflect the design's actual distribution.

---

## 5. Using this pack for QA

**What you can now verify without Figma and without image vision:**

1. **Color conformance** — diff the 30-color palette against any new hex literal. Any value not
   in the list is invented until proven otherwise.
2. **Geometry** — compare section heights, container widths, and radii against the frame
   `viewBox` and rect coordinates.
3. **Component dimensions** — exact widths/heights/radii for buttons, inputs, cards, icon
   circles.
4. **Token extraction** — the palette is the authoritative source for populating `globals.css`.

**What still requires an image-capable model or re-export:**

- Typography: family, size, weight, line-height, letter-spacing.
- Copy accuracy — whether implemented text matches the design, including the
  `Lorem ipsum` and placeholder-copy findings.
- Visual layout judgment: alignment, balance, spacing feel.
- Responsive verification beyond viewport width comparisons.

### To close the typography gap

Re-export the frames from Figma with **"Outline Text" disabled**, or export PNG at 1x and 2x.
SVG with live text would give both exact type specs *and* real copy strings — higher value than
PNG for this purpose, and no model switch required.

---

## 6. Follow-ups for the screenshot assets

- **Move into this directory.** `figma-landing.png` and `figma-landing-current.png` still sit
  untracked at the repository root.
- **Normalize filenames.** Five files use four conventions (`cms -products.svg` has a stray
  space; `product-{product}.svg` uses curly braces where the route uses square).
- **Fix the two mislabeled lines in [FIGMA.md](../../FIGMA.md).** Lines 7 and 8 both read
  `Products/[Product]` with no variant suffix, but line 8 (`13:2821`) is the *mobile* frame.
- **Consider size.** `landing page.svg` is 13.2 MB and `cms-edit-product.svg` 2.2 MB. Committed
  path data of this volume does not delta-compress well in Git. If repo weight matters, keep
  only the PNG exports here and treat SVG as a build-time artifact.
