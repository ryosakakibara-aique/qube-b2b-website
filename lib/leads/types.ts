export type ContactActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Initial state for the enquiry form.
 *
 * This lives outside `lib/leads/actions.ts` deliberately. A `"use server"` module may only export
 * async functions, and exporting a plain value from one is not caught by typecheck, lint or the
 * build — it fails at runtime when the browser loads the action module, which takes down every page
 * that renders the form.
 */
export const EMPTY_CONTACT_STATE: ContactActionState = { status: "idle" };
