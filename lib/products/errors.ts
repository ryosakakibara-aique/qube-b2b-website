/**
 * Turns a failed product query into a message that is safe to show a visitor.
 *
 * `PGRST205` means PostgREST could not find the table: the schema has not been set up, which is a
 * different problem from a transient outage and is worth naming, because the person seeing it is
 * usually the one who can fix it.
 */

export const PRODUCT_NOT_CONFIGURED =
  "The product catalogue is not connected in this environment.";

export const PRODUCT_NOT_SET_UP = "The product catalogue has not been set up yet.";

export const PRODUCT_UNAVAILABLE =
  "The product catalogue is temporarily unavailable.";

export function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** PostgREST's "table not found in the schema cache". */
export function isMissingRelation(error: unknown): boolean {
  return errorCode(error) === "PGRST205";
}

export function describeProductFailure(error: unknown): string {
  return isMissingRelation(error) ? PRODUCT_NOT_SET_UP : PRODUCT_UNAVAILABLE;
}
