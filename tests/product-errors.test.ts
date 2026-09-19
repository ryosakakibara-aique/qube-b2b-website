import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_NOT_SET_UP,
  PRODUCT_UNAVAILABLE,
  describeProductFailure,
  errorCode,
  isMissingRelation,
} from "../lib/products/errors.ts";

/**
 * Failure classification for product reads.
 *
 * This exists because a real environment returned `PGRST205` for every query and the visitor-facing
 * message said only "temporarily unavailable", which points at an outage rather than at the schema
 * the operator had not applied yet.
 */

test("recognises PostgREST's missing-table code", () => {
  assert.equal(isMissingRelation({ code: "PGRST205" }), true);
  assert.equal(isMissingRelation({ code: "PGRST202" }), false);
  assert.equal(isMissingRelation({ code: "42P01" }), false);
  assert.equal(isMissingRelation({ message: "boom" }), false);
  assert.equal(isMissingRelation(null), false);
  assert.equal(isMissingRelation(undefined), false);
  assert.equal(isMissingRelation("PGRST205"), false);
});

test("extracts a code only when there is one", () => {
  assert.equal(errorCode({ code: "PGRST205" }), "PGRST205");
  assert.equal(errorCode({ code: 404 }), null);
  assert.equal(errorCode({}), null);
  assert.equal(errorCode(null), null);
  assert.equal(errorCode(new Error("x")), null);
});

test("names the missing schema rather than blaming an outage", () => {
  assert.equal(describeProductFailure({ code: "PGRST205" }), PRODUCT_NOT_SET_UP);
  assert.match(PRODUCT_NOT_SET_UP, /not been set up/i);
});

test("falls back to a generic message for anything else", () => {
  assert.equal(describeProductFailure({ code: "08006" }), PRODUCT_UNAVAILABLE);
  assert.equal(describeProductFailure(new Error("network")), PRODUCT_UNAVAILABLE);
  assert.equal(describeProductFailure(null), PRODUCT_UNAVAILABLE);
});

test("never leaks the underlying error to the visitor", () => {
  const leaky = {
    code: "PGRST205",
    message: "Could not find the table 'public.products' in the schema cache",
    details: "connection string postgres://user:secret@host/db",
  };
  const message = describeProductFailure(leaky);
  assert.equal(message, PRODUCT_NOT_SET_UP);
  assert.doesNotMatch(message, /public\.products|postgres|secret/i);
});
