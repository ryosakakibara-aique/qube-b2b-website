# CMS Business Rules

> **Implementation status (V1).** These rules were written before the confirmed screen scope and
> conflict with CLAUDE.md on role names and workflow. The conflict was resolved by decision:
>
> - **Roles** follow CLAUDE.md: `admin`, `editor`, `viewer` (see [DATABASE.md](DATABASE.md)).
>   `CONTENT_EDITOR` maps to `editor`; `ADMIN` and `CONTENT_MANAGER` map to `admin`.
> - **Publishing** is implemented as a single `published` boolean toggled from the CMS product
>   list. The Draft → Review → Published stages are **not** implemented in V1.
> - **Deletion** is not exposed in the CMS. Soft delete, the audit log and restore are **not**
>   implemented in V1; no content can be deleted from the interface, so nothing is destroyed.
>
> The rules below remain the intended behaviour for a later phase. They are not overwritten,
> only deferred.

## Content

Only users with CONTENT_EDITOR permission can modify content.

## Publishing

Draft
↓
Review
↓
Published

Only ADMIN and CONTENT_MANAGER can publish.

## Deletion

Content cannot be permanently deleted immediately.

Deletion:

1. Soft delete
2. Record audit log
3. Allow restoration
