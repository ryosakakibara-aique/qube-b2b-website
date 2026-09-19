import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRichText, toPlainText } from "../lib/products/richtext.ts";

/**
 * The rich text subset. This is the only place where styling entered in the CMS becomes markup on
 * the public page, so the parsing rules are pinned here — especially the negative ones, which keep
 * ordinary prose from being mangled or interpreted.
 */

const textOf = (source: string) =>
  parseRichText(source)
    .map((block) =>
      block.type === "list"
        ? block.items.map((i) => i.map((s) => s.text).join("")).join(" | ")
        : block.lines.map((l) => l.map((s) => s.text).join("")).join(" / "),
    )
    .join(" || ");

test("plain text is returned untouched", () => {
  assert.deepEqual(parseRichText("Just a sentence."), [
    { type: "paragraph", lines: [[{ text: "Just a sentence." }]] },
  ]);
});

test("empty input produces no blocks", () => {
  assert.deepEqual(parseRichText(""), []);
  assert.deepEqual(parseRichText("\n\n"), []);
});

test("bold is recognised", () => {
  assert.deepEqual(parseRichText("a **bold** word"), [
    {
      type: "paragraph",
      lines: [[{ text: "a " }, { text: "bold", bold: true }, { text: " word" }]],
    },
  ]);
});

test("italic is recognised", () => {
  assert.deepEqual(parseRichText("*italic*"), [
    { type: "paragraph", lines: [[{ text: "italic", italic: true }]] },
  ]);
});

test("bold and italic can appear in one line", () => {
  const blocks = parseRichText("**bold** and *italic*");
  assert.equal(blocks[0].type, "paragraph");
  if (blocks[0].type !== "paragraph") return;
  assert.deepEqual(blocks[0].lines[0], [
    { text: "bold", bold: true },
    { text: " and " },
    { text: "italic", italic: true },
  ]);
});

test("unmatched markers stay literal", () => {
  assert.equal(textOf("a **b"), "a **b");
  assert.equal(textOf("a *b"), "a *b");
  assert.equal(textOf("**"), "**");
});

test("a marker followed by a space never opens a span", () => {
  // The rule that stops arithmetic and prose asterisks becoming emphasis.
  assert.equal(textOf("5 * 3 = 15 * 2"), "5 * 3 = 15 * 2");
  assert.equal(textOf("** not bold **"), "** not bold **");
});

test("a marker preceded by a space never closes a span", () => {
  assert.equal(textOf("*not italic *"), "*not italic *");
});

test("consecutive list items become one list", () => {
  assert.deepEqual(parseRichText("- one\n- two\n- three"), [
    {
      type: "list",
      items: [[{ text: "one" }], [{ text: "two" }], [{ text: "three" }]],
    },
  ]);
});

test("an asterisk can also start a list item", () => {
  assert.deepEqual(parseRichText("* item"), [
    { type: "list", items: [[{ text: "item" }]] },
  ]);
});

test("formatting inside a list item is kept", () => {
  assert.deepEqual(parseRichText("- **bold** item"), [
    {
      type: "list",
      items: [[{ text: "bold", bold: true }, { text: " item" }]],
    },
  ]);
});

test("a blank line starts a new paragraph", () => {
  const blocks = parseRichText("first\n\nsecond");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "paragraph");
});

test("a single newline stays inside the paragraph as its own line", () => {
  const blocks = parseRichText("first\nsecond");
  assert.equal(blocks.length, 1);
  if (blocks[0].type !== "paragraph") return;
  assert.equal(blocks[0].lines.length, 2);
});

test("a list interrupts a paragraph and the paragraph resumes after it", () => {
  const blocks = parseRichText("intro\n- a\n- b\noutro");
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["paragraph", "list", "paragraph"],
  );
});

test("blank lines around a list do not create empty blocks", () => {
  const blocks = parseRichText("\n- a\n\n- b\n");
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["list", "list"],
  );
});

test("Windows line endings are handled", () => {
  assert.equal(textOf("one\r\ntwo"), "one / two");
});

test("angle brackets and ampersands survive as literal text", () => {
  // Nothing here is HTML, and the renderer produces React elements, so this can never execute.
  const source = '<script>alert("x")</script> & <img src=x onerror=alert(1)>';
  assert.equal(textOf(source), source);
});

test("toPlainText strips the markers for metadata", () => {
  assert.equal(toPlainText("**Bold** and *italic*"), "Bold and italic");
  assert.equal(toPlainText("- one\n- two"), "one\ntwo");
  assert.equal(toPlainText("first\n\nsecond"), "first\n\nsecond");
  assert.equal(toPlainText("   "), "");
});
