import { ContactForm } from "@/components/marketing/contact-form";
import { Reveal } from "@/components/motion/reveal";

const highlights = [
  {
    title: "Real-time data tracking",
    body: "All transactions are reflected once they are made.",
  },
  {
    title: "Online configuration",
    body: "Services, pricing, values, and user flows.",
  },
  {
    title: "App connection",
    body: "QUBE App can now be downloaded on iOS.",
  },
  {
    title: "Customizability",
    body: "Hardware and software 100% customizable.",
  },
];

const tileBorders = ["border-b border-r", "border-b", "border-r", ""];

/**
 * The "Talk to an Expert" section, identical across the public screens in the design.
 * Extracted so the three pages share one implementation instead of three copies.
 */
export function ContactSection({ sourcePath }: { sourcePath: string }) {
  return (
    <Reveal
      as="section"
      id="contact"
      className="mx-auto grid w-full max-w-[1040px] gap-8 px-6 py-20 lg:grid-cols-2 lg:px-0 lg:py-28"
    >
      <ContactForm sourcePath={sourcePath} />

      <div className="grid grid-cols-2 rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)]">
        {highlights.map((highlight, index) => (
          <article
            key={highlight.title}
            className={`border-[var(--border-subtle)] p-5 ${tileBorders[index]}`}
          >
            <h3 className="text-sm font-semibold">{highlight.title}</h3>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{highlight.body}</p>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
