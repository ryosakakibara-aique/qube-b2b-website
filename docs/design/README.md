# Design Reference

Figma is the visual source of truth for this project (see [CLAUDE.md](../../CLAUDE.md) and
[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)).

This directory holds **committed design reference exports** so that implementation work and
visual QA do not depend on live Figma access.

## Figma file

| Field | Value |
| --- | --- |
| File | QUBE B2B Website + CMS |
| File key | `0vnDTxLADkHwJiaD6MplU3` |
| URL | `https://www.figma.com/design/0vnDTxLADkHwJiaD6MplU3/QUBE-B2B-Website---CMS` |

## How to add exports

Export each confirmed screen frame as PNG at 1x and 2x, and name the file after its
Figma node so the mapping stays traceable:

```
docs/design/
├── README.md
├── 1-1117-home.png              # /              (public landing)
├── 1-1926-products.png          # /products
├── 1-2070-product-detail.png    # /products/[product]
├── 1-2265-cms-login.png         # /cms/login
├── 1-2316-cms-products.png      # /cms/products
├── 1-2372-cms-create.png        # /cms/create
└── 1-2525-cms-edit.png          # /cms/edit/[product]
```

Naming convention: `figma-node-id` (colons replaced with hyphens) + screen slug.

### Export settings that matter

- Export at the frame's native size, and also at a mobile breakpoint. Responsive behaviour is
  a stated requirement (DESIGN_SYSTEM.md → Responsive Design), and a desktop-only export
  cannot verify it.
- Include component **states** where the design defines them (hover, focus, disabled, empty,
  error, loading). The Definition of Done treats correct states as part of "matches Figma".
- Prefer PNG for raster reference. Use SVG only for genuine vector assets (logos, icons).

## How this reference is used

```text
Figma frame (this directory)
  -> Implement
  -> Compare
  -> Correct
  -> Approve
```

Visual QA is continuous, not a final phase (DESIGN_SYSTEM.md → Visual QA).

## Current status

The frames **have** been exported, as SVG, to [`screenshots/`](screenshots/). The extracted
reference is recorded in:

- [DESIGN-REFERENCE.md](DESIGN-REFERENCE.md) — analysis, palette, geometry, conformance report
- [design-measurements.json](design-measurements.json) — machine-readable measurements

Node correspondence is confirmed (see [FIGMA-MAPPING.md](FIGMA-MAPPING.md)).

**Still outstanding:** the SVG exports have **no typography and no copy text** — Figma
outline-converted every glyph to a `<path>`. So font family, size, weight, line-height, and
letter-spacing remain unverified, and implemented text cannot be compared against the design.

To close that gap, export the frames a second time with either:

- **SVG with "Outline Text" disabled** — preferred; yields exact type specs *and* real copy
  strings, and needs no image-capable model, or
- **PNG at 1x and 2x** — enables true visual comparison, but requires an image-capable model.

Use the naming convention described above when adding them here.

Existing reference material elsewhere in the repo:

- `figma-landing.png`, `figma-landing-current.png` — landing-page references at the repository
  root, currently **untracked**. These should be moved here and named per the convention above.
- `public/section-*.png`, `public/detail-*.png` — section exports consumed directly by the
  implementation. These are runtime assets; do not move them.
