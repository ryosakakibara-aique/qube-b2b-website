@AGENTS.md

# Project Instructions

## Product

This project consists of:

1. Public Website
2. Admin CMS
3. Backend API

## Technology

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- REST API

## Architecture

- Use modular components.
- Avoid duplicated UI.
- Business logic must not live inside presentation components.
- Use server components where appropriate.
- Use client components only when necessary.

## UI

- Figma is the source of truth for visual design.
- Reuse existing components before creating new ones.
- Do not introduce arbitrary colors.
- Do not introduce arbitrary spacing.
- Use design tokens.
- Follow responsive behavior defined in Figma.

## Components

Before creating a component:

1. Search existing components.
2. Reuse if possible.
3. Extend if appropriate.
4. Create a new component only when necessary.

## Code Quality

- TypeScript strict mode.
- No unnecessary `any`.
- No duplicated business logic.
- No hardcoded production credentials.
- Validate API inputs.
- Handle loading/error/empty states.

## CMS

All CMS functionality must include:

- loading state
- empty state
- error state
- validation
- success feedback
- permission checking

## Testing

Every major feature must include:

- unit tests where appropriate
- integration tests where appropriate
- end-to-end testing for critical flows

## Before completing a task

1. Run type checking.
2. Run linting.
3. Run tests.
4. Verify responsive behavior.
5. Compare implementation against Figma.
