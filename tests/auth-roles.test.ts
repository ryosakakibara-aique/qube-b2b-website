import { test } from "node:test";
import assert from "node:assert/strict";
import {
  USER_ROLES,
  canDeleteContent,
  canEditContent,
  isUserRole,
  resolveAccessState,
  resolveSessionRole,
} from "../lib/auth/roles.ts";

/**
 * The authorization policy itself. These predicates are also mirrored in the database by RLS, so a
 * change here without a matching migration is a bug — this suite makes the intent explicit.
 */

test("the role set is exactly the documented three", () => {
  assert.deepEqual([...USER_ROLES], ["admin", "editor", "viewer"]);
});

test("accepts only the known roles, case-sensitively", () => {
  for (const role of USER_ROLES) assert.equal(isUserRole(role), true);

  for (const value of ["ADMIN", "Admin", "owner", "superuser", "", " admin", null, undefined, 0, 1, {}, []]) {
    assert.equal(isUserRole(value), false, `wrongly accepted ${JSON.stringify(value)}`);
  }
});

test("editors and admins may change content", () => {
  assert.equal(canEditContent("admin"), true);
  assert.equal(canEditContent("editor"), true);
  assert.equal(canEditContent("viewer"), false);
});

test("only admins may delete content", () => {
  assert.equal(canDeleteContent("admin"), true);
  assert.equal(canDeleteContent("editor"), false);
  assert.equal(canDeleteContent("viewer"), false);
});

test("deletion is never available to a role that cannot edit", () => {
  for (const role of USER_ROLES) {
    if (canDeleteContent(role)) {
      assert.equal(canEditContent(role), true, `${role} can delete but not edit`);
    }
  }
});

/**
 * Having an account is not the same as being staff. Supabase projects allow public sign-up by
 * default, so an account that an operator has not approved must resolve to no access at all —
 * otherwise anyone could register and read unpublished drafts and customer enquiries.
 */
test("an unapproved account has no role, whatever its stored role says", () => {
  for (const role of USER_ROLES) {
    assert.equal(
      resolveSessionRole({ role, approved: false }),
      null,
      `unapproved ${role} must not resolve to a role`,
    );
  }
});

test("an approved account resolves to its role", () => {
  assert.equal(resolveSessionRole({ role: "admin", approved: true }), "admin");
  assert.equal(resolveSessionRole({ role: "editor", approved: true }), "editor");
  assert.equal(resolveSessionRole({ role: "viewer", approved: true }), "viewer");
});

test("a missing profile, or a missing approval flag, resolves to nothing", () => {
  assert.equal(resolveSessionRole(null), null);
  assert.equal(resolveSessionRole(undefined), null);
  assert.equal(resolveSessionRole({}), null, "no approved flag must mean not approved");
  assert.equal(resolveSessionRole({ role: "admin" }), null);
});

test("an unrecognised role never resolves, even when approved", () => {
  assert.equal(resolveSessionRole({ role: "owner", approved: true }), null);
  assert.equal(resolveSessionRole({ role: null, approved: true }), null);
  assert.equal(resolveSessionRole({ role: 1, approved: true }), null);
});

test("approval must be a true boolean, not a truthy value", () => {
  assert.equal(resolveSessionRole({ role: "admin", approved: "true" }), null);
  assert.equal(resolveSessionRole({ role: "admin", approved: 1 }), null);
});

const ACCOUNT = { id: "user-1", email: "staff@example.com" };

test("no account is anonymous, whatever the profile says", () => {
  assert.deepEqual(resolveAccessState(null, { role: "admin", approved: true }), {
    status: "anonymous",
  });
  assert.deepEqual(resolveAccessState(null, null), { status: "anonymous" });
});

test("an account without approval is pending, not anonymous and not active", () => {
  for (const role of USER_ROLES) {
    assert.deepEqual(
      resolveAccessState(ACCOUNT, { role, approved: false }),
      { status: "pending" },
      `unapproved ${role} must be pending`,
    );
  }
  assert.deepEqual(resolveAccessState(ACCOUNT, null), { status: "pending" });
  assert.deepEqual(resolveAccessState(ACCOUNT, {}), { status: "pending" });
});

test("an approved account becomes active with its role", () => {
  assert.deepEqual(resolveAccessState(ACCOUNT, { role: "editor", approved: true }), {
    status: "active",
    user: { id: "user-1", email: "staff@example.com", role: "editor" },
  });
});

test("an approved account with an unrecognised role is pending rather than trusted", () => {
  assert.deepEqual(
    resolveAccessState(ACCOUNT, { role: "owner", approved: true }),
    { status: "pending" },
  );
});

test("pending and anonymous are never conflated", () => {
  const pending = resolveAccessState(ACCOUNT, { role: "admin", approved: false });
  const anonymous = resolveAccessState(null, null);
  assert.notEqual(pending.status, anonymous.status);
});
