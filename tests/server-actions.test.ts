import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * A `"use server"` module may only export async functions.
 *
 * This rule is enforced by the Next.js runtime, not by any of the checks that normally gate this
 * project: it is invisible to `tsc`, eslint and `next build`. Exporting one plain value from
 * `lib/leads/actions.ts` produced a build that passed and a page that died in the browser with
 * `A "use server" file can only export async functions, found object` — taking down every page that
 * rendered the contact form. This suite closes that gap statically.
 */

function collectSourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...collectSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return found;
}

function firstMeaningfulLine(source: string): string {
  return (
    source
      .split(/\r?\n/)
      .find((line) => line.trim() !== "") ?? ""
  ).trim();
}

function isServerModule(file: string): boolean {
  return /^["']use server["'];?$/.test(firstMeaningfulLine(fs.readFileSync(file, "utf8")));
}

const projectRoot = process.cwd();
const serverModules = ["app", "lib"]
  .flatMap((directory) => collectSourceFiles(path.join(projectRoot, directory)))
  .filter(isServerModule)
  .map((file) => path.relative(projectRoot, file).replace(/\\/g, "/"))
  .sort();

/** Exports that are safe in a `"use server"` module: async functions, and types (erased). */
const ALLOWED =
  /^export\s+(async\s+function\b|type\b|interface\b|type\s*\{|default\s+async\s+function\b)/;

function offendingExports(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line.startsWith("export "))
    .filter(({ line }) => !ALLOWED.test(line))
    .map(({ line, number }) => `  line ${number}: ${line}`);
}

test("the server-action modules are discovered", () => {
  assert.ok(
    serverModules.length >= 3,
    `expected to find the use-server modules, found: ${serverModules.join(", ")}`,
  );
});

for (const modulePath of serverModules) {
  test(`${modulePath} exports only async functions`, () => {
    const source = fs.readFileSync(path.join(projectRoot, modulePath), "utf8");
    const offenders = offendingExports(source);

    assert.deepEqual(
      offenders,
      [],
      `${modulePath} is a "use server" module, so it may only export async functions. ` +
        `Move constants, types and non-async values into a plain module (for example ` +
        `lib/leads/types.ts) and import them from there.\n${offenders.join("\n")}`,
    );
  });
}
