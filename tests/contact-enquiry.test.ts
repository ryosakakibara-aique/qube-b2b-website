import { test } from "node:test";
import assert from "node:assert/strict";
import { submitContactEnquiry } from "../lib/leads/actions.ts";
import { EMPTY_CONTACT_STATE } from "../lib/leads/types.ts";

/**
 * Contact enquiry handling.
 *
 * Validation runs before anything touches Supabase, so every rejection path is testable without a
 * database. The unconfigured path doubles as proof that a valid submission is never silently
 * swallowed.
 */

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function enquiry(overrides: Record<string, string> = {}) {
  return form({
    name: "Maria Santos",
    email: "maria@example.com",
    company: "Example Corp",
    location: "Manila",
    message: "We would like lockers for our building.",
    sourcePath: "/products/pandora",
    ...overrides,
  });
}

test("starts idle", () => {
  assert.equal(EMPTY_CONTACT_STATE.status, "idle");
});

test("requires a name and an e-mail address", async () => {
  const state = await submitContactEnquiry({ status: "idle" }, form({ sourcePath: "/" }));
  assert.equal(state.status, "error");
  assert.ok(state.fieldErrors?.name);
  assert.ok(state.fieldErrors?.email);
});

test("rejects an address that is not an e-mail", async () => {
  for (const email of ["nope", "nope@", "@example.com", "a@b", "a b@example.com"]) {
    const state = await submitContactEnquiry({ status: "idle" }, enquiry({ email }));
    assert.equal(state.status, "error", `expected "${email}" to be rejected`);
    assert.ok(state.fieldErrors?.email);
  }
});

test("accepts ordinary and sub-addressed e-mails", async () => {
  for (const email of ["maria@example.com", "maria.santos@example.co.uk", "maria+cms@example.com"]) {
    const state = await submitContactEnquiry({ status: "idle" }, enquiry({ email }));
    assert.equal(
      state.fieldErrors?.email,
      undefined,
      `wrongly rejected a valid address: ${email}`,
    );
  }
});

test("bounds the optional fields", async () => {
  const state = await submitContactEnquiry(
    { status: "idle" },
    enquiry({
      name: "x".repeat(121),
      company: "y".repeat(121),
      location: "z".repeat(121),
      message: "m".repeat(2001),
    }),
  );
  assert.equal(state.status, "error");
  assert.deepEqual(Object.keys(state.fieldErrors ?? {}).sort(), [
    "company",
    "location",
    "message",
    "name",
  ]);
});

test("a bot that fills the hidden field is accepted without being stored", async () => {
  // The honeypot short-circuits before validation and before any database access, so a filled
  // value returns success rather than an error the bot could learn from.
  const state = await submitContactEnquiry(
    { status: "idle" },
    enquiry({ website: "https://spam.example" }),
  );
  assert.equal(state.status, "success");
});

test("a valid enquiry is never silently accepted when the catalogue is disconnected", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const state = await submitContactEnquiry({ status: "idle" }, enquiry());
    assert.equal(state.status, "error");
    assert.match(state.error ?? "", /not connected/i);
  } finally {
    if (previousUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
