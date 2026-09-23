import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The wiring between the form, the payload and the database function.
 *
 * A field can be added to the CMS form and to validation and still never reach the database, because
 * the only thing connecting them is a hand-written argument list in one function. Nothing type-checks
 * that list — the Supabase client is untyped, and a mistyped or missing argument is a silent no-op
 * rather than an error — so it is checked here instead, in both directions:
 *
 * - every parameter the SQL function declares is sent, by name;
 * - every field the payload carries is referenced when building the call.
 *
 * The card/hero split is what made this worth pinning: adding a field now means touching three files,
 * and forgetting the third would look like a working upload that never persists.
 */

const projectRoot = process.cwd();
const MIGRATION = "supabase/migrations/003_card_and_hero_images.sql";
const ACTIONS = "lib/products/actions.ts";
const VALIDATION = "lib/products/validation.ts";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

/** The named parameters the newest `save_product_content` declares. */
function declaredParameters(): string[] {
  const sql = read(MIGRATION);
  const signature =
    /create or replace function public\.save_product_content\(([\s\S]*?)\)\s*returns uuid/.exec(
      sql,
    )?.[1] ?? "";

  return [...signature.matchAll(/(p_[a-z_]+)\s+(?:uuid|text|text\[\]|boolean|jsonb)/g)].map(
    (match) => match[1],
  );
}

/** The named arguments the server action sends. */
function sentArguments(): string[] {
  const actions = read(ACTIONS);
  const call =
    /rpc\(\s*"save_product_content",\s*\{([\s\S]*?)\}\s*\)/.exec(actions)?.[1] ?? "";

  return [...call.matchAll(/(p_[a-z_]+)\s*:/g)].map((match) => match[1]);
}

test("the save call sends exactly the parameters the database declares", () => {
  const declared = declaredParameters();
  const sent = sentArguments();

  assert.ok(
    declared.length >= 14,
    `expected the extended signature, found ${declared.length} parameters: ${declared.join(", ")}`,
  );

  assert.deepEqual(
    [...sent].sort(),
    [...declared].sort(),
    "the argument list and the SQL signature have drifted apart: a parameter that is declared but " +
      "not sent stays at its column default, and one that is sent but not declared fails the call",
  );
});

test("every field the payload carries is sent to the database", () => {
  const validation = read(VALIDATION);
  const actions = read(ACTIONS);

  const payloadType =
    /export type ProductPayload = \{([\s\S]*?)\n\};/.exec(validation)?.[1] ?? "";
  const fields = [...payloadType.matchAll(/^\s{2}([a-zA-Z]+)\??:/gm)].map(
    (match) => match[1],
  );

  assert.ok(
    fields.length >= 13,
    `expected to read the payload fields, found: ${fields.join(", ")}`,
  );

  const missing = fields.filter(
    (field) => !actions.includes(`payload.${field}`),
  );

  assert.deepEqual(
    missing,
    [],
    "validation collects these but the save call never reads them, so they would be silently " +
      "dropped: add them to the argument list in lib/products/actions.ts",
  );
});

test("both image fields exist as their own columns", () => {
  const sql = read(MIGRATION);

  for (const column of ["card_image_url", "card_image_alt"]) {
    assert.ok(
      sql.includes(`add column if not exists ${column}`),
      `${column} must be added by the migration, and additively so the running deploy keeps working`,
    );
  }

  assert.ok(
    sql.includes("revoke execute on function public.save_product_content"),
    "grants are per-signature and a new function is executable by PUBLIC until revoked, so the new " +
      "overload needs its own revoke",
  );
});
