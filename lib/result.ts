/**
 * The result of a data read.
 *
 * Lives in its own module because every domain returns it: reads never fall back to fabricated
 * content, so a failure is reported and the caller renders an explicit state instead.
 */
export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
