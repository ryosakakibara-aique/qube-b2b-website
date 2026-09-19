# DESIGN_SYSTEM.md

## Purpose

This document defines how the Figma design is translated into the production UI.

**Figma is the source of truth.**

The values below describe implementation rules. They are not permission to invent visual values.

---

## Design Principles

- Minimal
- Modern
- Clear
- Fast
- Accessible
- Responsive
- Consistent
- Figma-faithful

Prioritize actual Figma decisions over generic design-system defaults.

---

## Token Rules

Use CSS variables as the canonical token layer.

Do not create a redundant `tokens/*.ts` system unless a real programmatic requirement appears.

Example structure only:

```css
:root {
  --color-background: ...;
  --color-foreground: ...;
  --color-primary: ...;
  --color-primary-foreground: ...;
  --color-muted: ...;
  --color-border: ...;

  --radius-sm: ...;
  --radius-md: ...;
  --radius-lg: ...;

  --font-sans: ...;
}
```

The actual values must be extracted or verified from Figma.

Never use placeholder/example values as production values.

---

## Figma → Code Mapping

For each Figma design, identify:

### Color
- background
- foreground
- primary
- secondary
- muted
- border
- destructive
- state colors

### Typography
- font family
- weight
- size
- line height
- letter spacing
- text hierarchy

### Spacing
- page padding
- section spacing
- component spacing
- grid gaps
- form spacing

### Shape
- border radius
- borders
- shadows
- dividers

### Layout
- max-width
- grid
- flex behavior
- alignment
- responsive breakpoints

### States
- hover
- focus
- active
- disabled
- loading
- empty
- error
- success

Do not approximate these if Figma provides the information.

---

## Tailwind

Use Tailwind utilities for implementation.

Map semantic design tokens through CSS variables.

Avoid large collections of arbitrary values.

Arbitrary values are acceptable when:
- Figma contains a genuinely unique value,
- the value is not part of a reusable system,
- and introducing a token would add unnecessary complexity.

Repeated values should become tokens.

---

## shadcn/ui

shadcn/ui is a primitive/accessibility foundation, not the product's visual identity.

Use it for:
- dialogs
- dropdowns
- sheets
- forms
- tables
- tabs
- accessible interactions

Customize the visual layer to match Figma.

Do not blindly use default shadcn colors, radius, spacing, or typography.

---

## Components

Before creating a component:

1. Search for an existing equivalent.
2. Determine whether it can be reused.
3. Determine whether a small extension is enough.
4. Create a new component only when necessary.

Avoid:
- duplicate components
- giant components
- components with unrelated responsibilities
- excessive prop configuration
- generic abstractions without multiple real use cases

---

## Marketing UI

Marketing components should be content-appropriate and semantic.

Use meaningful HTML:
- `header`
- `nav`
- `main`
- `section`
- `article`
- `footer`
- headings
- lists
- links

Do not turn every visual container into a generic `<div>`.

---

## CMS UI

CMS components should prioritize:
- clarity
- predictable interactions
- keyboard accessibility
- validation
- feedback
- responsive behavior

The CMS App Shell should remain separate from product business logic.

---

## Responsive Design

Implement responsive behavior based on Figma.

Do not assume desktop layouts simply scale down.

Verify:
- navigation
- typography
- cards
- grids
- forms
- tables
- images
- spacing
- touch targets

At minimum, validate the Figma's intended desktop and mobile states.

---

## Accessibility

Design-system components must support:
- keyboard navigation
- visible focus
- semantic labels
- appropriate contrast
- accessible states

Do not use ARIA as a substitute for correct HTML semantics.

---

## SEO and LLM-Friendly Design

Good information architecture serves both humans and machines.

The design should support:
- clear heading hierarchy
- meaningful link text
- readable content sections
- visible important information
- semantic HTML
- stable content structure

Do not hide critical public content exclusively behind client-side interactions.

---

## Visual QA

For every major screen:

```text
Figma
  ↓
Implementation
  ↓
Visual comparison
  ↓
Correction
  ↓
Approval
```

Compare:
- geometry
- spacing
- typography
- color
- imagery
- states
- responsive behavior

Do not accept "close enough" when the Figma specification is available.

---

## Performance

Design choices should avoid unnecessary client-side work.

Prefer:
- server-rendered public content
- optimized images
- minimal animations
- lightweight interaction
- minimal third-party scripts

Animations must not interfere with accessibility or performance.

---

## Definition of Done for UI

A UI component/screen is complete when:
- it matches the relevant Figma design
- responsive behavior is correct
- interaction states are covered
- accessibility is addressed
- no unnecessary dependencies were introduced
- no console errors remain
- it integrates cleanly with the established component system
