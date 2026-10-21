import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The wiring between the form, the payload and the table.
 *
 * Same lesson as `tests/product-save-wiring.test.ts`: a field can be rendered, validated and then
 * never reach the database, because the only thing connecting them is a hand-written object literal
 * in one function, and the Supabase client is untyped. A missing key is a silent no-op on an upsert —
 * the save "succeeds" and the copy quietly does not change.
 *
 * So this checks both directions, plus the two revalidations that make a save visible at all.
 */

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const MIGRATION = "supabase/migrations/005_homepage_content.sql";
const ACTIONS = "lib/content/actions.ts";
const VALIDATION = "lib/content/validation.ts";
const FORM = "components/cms/homepage-form.tsx";

/**
 * Columns the row builder must not send: the trigger stamps both, and sending them would let a stale
 * client value overwrite the audit trail.
 */
const AUDIT_COLUMNS = new Set(["updated_at", "updated_by"]);

/** The editorial columns the table declares. */
function declaredColumns(): string[] {
  const sql = read(MIGRATION);
  const block =
    /create table if not exists public\.homepage \(([\s\S]*?)\n\);/.exec(sql)?.[1] ?? "";

  return [...block.matchAll(/^\s{2}([a-z_]+)\s+(?:integer|text|jsonb|timestamptz|uuid)/gm)]
    .map((match) => match[1])
    .filter((column) => !AUDIT_COLUMNS.has(column));
}

/** The keys the save writes. */
function writtenColumns(): string[] {
  const actions = read(ACTIONS);
  const builder =
    /function toHomepageRow\(payload: HomepageContent\) \{([\s\S]*?)\n\}/.exec(actions)?.[1] ?? "";

  return [...builder.matchAll(/^\s{4}([a-z_]+):/gm)].map((match) => match[1]);
}

test("the save writes exactly the columns the table declares", () => {
  const declared = declaredColumns();
  const written = writtenColumns();

  assert.ok(declared.length >= 15, `expected the full table, found ${declared.length}`);
  assert.ok(written.length >= 15, `expected the row builder, found ${written.length}`);

  assert.deepEqual(
    [...written].sort(),
    [...declared].sort(),
    "a column that is declared but never written stays at its NOT NULL default — an empty string — " +
      "and one that is written but not declared fails the upsert",
  );
});

test("the audit columns belong to the trigger, not the client", () => {
  const sql = read(MIGRATION);

  assert.match(
    sql,
    /new\.updated_by = auth\.uid\(\)/,
    "the editor's id is recorded by the database: a client-sent value could claim any author",
  );
  assert.match(sql, /new\.updated_at = now\(\)/);
  assert.match(
    sql,
    /before insert or update on public\.homepage/,
    "the trigger must cover the first save too, which is an insert",
  );
});

test("the save is an upsert on the singleton id", () => {
  const actions = read(ACTIONS);

  assert.match(actions, /from\("homepage"\)/, "the write targets the homepage table");
  assert.match(
    actions,
    /upsert\(toHomepageRow\(validation\.payload\), \{ onConflict: "id" \}\)/,
    "the record may not exist yet — the migration seeds no row — so the first save is an insert",
  );
  assert.match(
    read(MIGRATION),
    /id integer primary key check \(id = 1\)/,
    "one row only: the check is what makes the singleton an invariant rather than a convention",
  );
});

test("a save refreshes every route that renders the copy", () => {
  const actions = read(ACTIONS);

  for (const route of ["/", "/products", "/cms/home"]) {
    assert.ok(
      actions.includes(`revalidatePath("${route}")`),
      `${route} is cached for five minutes; without a revalidation a save looks like it did nothing. ` +
        "The stories also render on the catalogue, which is why it is not only the landing page.",
    );
  }
});

test("every field validation reads is a field the form renders", () => {
  const validation = read(VALIDATION);
  const form = read(FORM);

  const requiredNames = [
    ...validation.matchAll(/required\(\s*formData,\s*fieldErrors,\s*"([a-zA-Z]+)"/g),
  ].map((match) => match[1]);
  const directNames = [
    ...validation.matchAll(/text\(formData,\s*"([a-zA-Z]+)"\)/g),
  ].map((match) => match[1]);

  const names = [...new Set([...requiredNames, ...directNames])];

  assert.ok(
    names.length >= 11,
    `expected the scalar fields, found ${names.join(", ") || "none"}`,
  );
  assert.ok(names.includes("videoUrl"), "the video link is read");
  assert.ok(names.includes("videoTitle"), "the video description is read");

  const missing = names.filter((name) => !form.includes(`name="${name}"`));
  assert.deepEqual(
    missing,
    [],
    "these are read by validation but never posted by the form, so they would always be empty",
  );
});

test("the repeated groups are wired by position", () => {
  const validation = read(VALIDATION);
  const form = read(FORM);

  const fieldTemplates = [
    "feature${position}Title",
    "feature${position}Headline",
    "feature${position}Text",
    "tile${position}Label",
    "logo${position}Name",
    "story${position}Name",
    "story${position}LogoUrl",
  ];

  for (const template of fieldTemplates) {
    assert.ok(
      validation.includes(template) && form.includes(template),
      `${template} is not wired through both the form and validation`,
    );
  }

  // Image fields carry their names into the shared upload component, which is what posts them.
  for (const template of [
    "tile${position}ImageUrl",
    "logo${position}ImageUrl",
    "story${position}ImageUrl",
  ]) {
    assert.ok(
      form.includes(`urlName={\`${template}\`}`),
      `${template} is not passed to the image field, so the upload would never be saved`,
    );
  }
});

test("the form posts both group counts, so a removed row disappears from the record", () => {
  const form = read(FORM);
  const validation = read(VALIDATION);

  assert.match(form, /name="logoCount"/);
  assert.match(form, /name="storyCount"/);
  assert.match(
    validation,
    /clampCount\(formData, "logoCount", MAX_LOGO_COUNT\)/,
    "validation has to read the same hidden count, or removing a row would leave a stale entry",
  );
  assert.match(validation, /clampCount\(formData, "storyCount", MAX_STORY_COUNT\)/);
});

test("the two fixed groups are not addable or removable in the form", () => {
  const form = read(FORM);

  assert.ok(
    !form.includes("Add business") && !form.includes("Remove business"),
    "twelve cells is the design's number: an add button on a fixed group invites a broken grid",
  );
  assert.ok(
    !form.includes("Add tile") && !form.includes("Remove tile"),
    "nine slots is the panel's geometry, not a preference",
  );
  assert.ok(form.includes("Add logo") && form.includes("Add story"));
});
