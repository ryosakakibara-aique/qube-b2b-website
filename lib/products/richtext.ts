/**
 * Minimal rich text for product content.
 *
 * Deliberately not HTML. The CMS offers Bold, Italic and List, which are stored as a tiny
 * markdown subset and rendered to React elements — never to raw HTML. That keeps the public page
 * safe by construction: there is no sanitizer to get wrong, because no markup from the database is
 * ever interpreted as markup.
 *
 * Supported:
 *   **bold**        bold
 *   *italic*        italic
 *   - item          a list item (a run of consecutive items becomes one list)
 *   blank line      starts a new paragraph
 *   single newline  a line break inside the same paragraph
 *
 * Anything else is literal text.
 */

export type RichTextSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

export type RichTextBlock =
  | { type: "paragraph"; lines: RichTextSpan[][] }
  | { type: "list"; items: RichTextSpan[][] };

const LIST_ITEM = /^\s*[-*]\s+(.*)$/;

/**
 * Finds the closing marker for a span, or -1 when the marker is not a real span.
 *
 * The "no whitespace just inside the markers" rule is what stops ordinary text from turning into
 * emphasis: "5 * 3 = 15" has a space after the opening `*`, so it stays literal.
 */
function findClosing(text: string, from: number, marker: string): number {
  if (from >= text.length || /\s/.test(text[from])) return -1;

  let searchFrom = from;
  while (searchFrom < text.length) {
    const at = text.indexOf(marker, searchFrom);
    if (at === -1) return -1;
    if (at > from && !/\s/.test(text[at - 1])) return at;
    searchFrom = at + marker.length;
  }
  return -1;
}

function parseInline(text: string): RichTextSpan[] {
  const spans: RichTextSpan[] = [];
  let buffer = "";
  let index = 0;

  const flush = () => {
    if (buffer) spans.push({ text: buffer });
    buffer = "";
  };

  while (index < text.length) {
    if (text.startsWith("**", index)) {
      const end = findClosing(text, index + 2, "**");
      if (end > -1) {
        flush();
        spans.push({ text: text.slice(index + 2, end), bold: true });
        index = end + 2;
        continue;
      }
      // A `**` that cannot open is plain text, and both characters are consumed together so the
      // second asterisk cannot be mistaken for the start of an italic span.
      buffer += "**";
      index += 2;
      continue;
    }

    if (text[index] === "*") {
      const end = findClosing(text, index + 1, "*");
      if (end > -1) {
        flush();
        spans.push({ text: text.slice(index + 1, end), italic: true });
        index = end + 1;
        continue;
      }
    }

    buffer += text[index];
    index += 1;
  }

  flush();
  return spans.length > 0 ? spans : [{ text }];
}

export function parseRichText(source: string): RichTextBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichTextBlock[] = [];

  let paragraph: RichTextSpan[][] = [];
  let list: RichTextSpan[][] = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const closeList = () => {
    if (list.length > 0) blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const line of lines) {
    const item = LIST_ITEM.exec(line);

    if (item) {
      closeParagraph();
      list.push(parseInline(item[1]));
      continue;
    }

    closeList();

    if (line.trim() === "") {
      closeParagraph();
      continue;
    }

    paragraph.push(parseInline(line));
  }

  closeList();
  closeParagraph();

  return blocks;
}

/** The text without its formatting markers, for metadata and previews. */
export function toPlainText(source: string): string {
  return parseRichText(source)
    .map((block) =>
      block.type === "list"
        ? block.items.map((item) => item.map((span) => span.text).join("")).join("\n")
        : block.lines.map((line) => line.map((span) => span.text).join("")).join("\n"),
    )
    .join("\n\n")
    .trim();
}

/**
 * The text without its formatting markers, collapsed onto one line — for a card, where the stored
 * markdown would otherwise be printed verbatim.
 *
 * Cards read `product.description` straight from the record. That field holds the CMS's markdown
 * subset, so a bolded opening sentence reached the catalogue as `**Automate parcel receiving.**`,
 * markers and all, while the same field was already being reduced for the page's metadata. This
 * closes that gap for every surface that shows the description as a single line of prose.
 *
 * Newlines become spaces because a preview is one paragraph: a list's items would otherwise run
 * together ("Parcel Management\nProperty Tech") or break the card's line clamping. `toPlainText`
 * stays as it is — metadata wants the paragraph structure preserved.
 */
export function toSingleLineText(source: string): string {
  return toPlainText(source).replace(/\s*\n+\s*/g, " ").trim();
}
