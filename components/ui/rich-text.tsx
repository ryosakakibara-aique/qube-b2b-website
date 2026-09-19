import { Fragment, type ReactNode } from "react";
import { parseRichText, type RichTextSpan } from "@/lib/products/richtext";

/**
 * Renders product content stored as the small markdown subset in `lib/products/richtext.ts`.
 *
 * Every span becomes a React element, so text from the database is escaped by React and can never
 * be interpreted as markup. No `dangerouslySetInnerHTML` is involved.
 */
function Span({ span, index }: { span: RichTextSpan; index: number }) {
  let node: ReactNode = span.text;
  if (span.bold) node = <strong>{node}</strong>;
  if (span.italic) node = <em>{node}</em>;
  return <Fragment key={index}>{node}</Fragment>;
}

export function RichText({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const blocks = parseRichText(source);
  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const spacing = blockIndex > 0 ? "mt-4" : undefined;

        if (block.type === "list") {
          return (
            <ul
              key={blockIndex}
              className={`list-disc space-y-1 pl-5 ${spacing ?? ""}`.trim()}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.map((span, spanIndex) => (
                    <Span key={spanIndex} span={span} index={spanIndex} />
                  ))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className={spacing}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line.map((span, spanIndex) => (
                  <Span key={spanIndex} span={span} index={spanIndex} />
                ))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
