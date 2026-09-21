import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Empower your workspace",
    description:
      "A professional design agent, native to the canvas. It works directly on your site to generate and refine in place, with every change visible, editable, and under your control.",
  },
  {
    title: "Improve your customers’ experience",
    description:
      "A professional design agent, native to the canvas. It works directly on your site to generate and refine in place, with every change visible, editable, and under your control.",
  },
  {
    title: "Expand your business’ reach",
    description:
      "A professional design agent, native to the canvas. It works directly on your site to generate and refine in place, with every change visible, editable, and under your control.",
  },
];

const workspaceStats = [
  { label: "Occupied", value: "78", change: "+8%" },
  { label: "Reservations", value: "14", change: "+2%" },
  { label: "Users", value: "143", change: "+16%" },
];

function FeatureCard({ title, description, index }: Feature & { index: number }) {
  return (
    <Reveal
      as="article"
      index={index}
      className="w-full shrink-0 rounded-[32px] border border-[#cbd5e1] p-3"
    >
      <div
        className="h-[280px] w-full rounded-[20px] bg-[#e2e8f0] sm:h-[400px]"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 px-3 pb-6 pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[420px]">
          <h3 className="text-base font-bold text-[#27272a]">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-[#3f3f46]">{description}</p>
        </div>
        <Link
          href="#"
          className="shrink-0 text-sm font-medium text-[#27272a] hover:underline"
        >
          Learn More
        </Link>
      </div>
    </Reveal>
  );
}

function WorkspacePreviewCard() {
  return (
    /* Fade rather than rise: this card is sticky from `lg` up, and a transform on a sticky element
       is one of the few places engines still disagree about, so it never gets one. */
    <Reveal
      as="aside"
      variant="fade"
      className="w-full shrink-0 rounded-[32px] border border-[#cbd5e1] bg-[#f1f5f9] p-3 lg:sticky lg:top-8 lg:w-80"
    >
      <div className="rounded-[20px] bg-[#e2e8f0] p-3">
        <span className="inline-flex rounded-lg border-[0.5px] border-[#00c290] bg-gradient-to-b from-[#00c290]/30 via-[49.519%] via-[#0fb8aa]/30 to-[#1fadc5]/30 px-3 py-1">
          <span className="bg-gradient-to-b from-[#00c290] via-[49.519%] via-[#0fb8aa] to-[#1fadc5] bg-clip-text text-[10px] font-medium text-transparent">
            My Workspace
          </span>
        </span>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {workspaceStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[10px] text-[#27272a]">{stat.label}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-lg font-semibold text-[#27272a]">
                  {stat.value}
                </span>
                <span className="bg-gradient-to-b from-[#00c290] via-[49.519%] via-[#0fb8aa] to-[#1fadc5] bg-clip-text text-[10px] font-bold text-transparent">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 p-3 text-[10px]">
        <span
          className="h-2 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-[#00c290] via-[49.519%] via-[#0fb8aa] to-[#1fadc5]"
          aria-hidden="true"
        />
        <p>
          <span className="font-bold text-[#27272a]">Alex Chua</span>{" "}
          <span className="font-normal text-[#71717a]">
            just reserved a locker via Employee Portal
          </span>
        </p>
      </div>
    </Reveal>
  );
}

export function ParallaxFeaturesSection() {
  return (
    <div className="w-full">
      <Reveal
        as="div"
        index={0}
        className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-start sm:justify-between"
      >
        <h2 className="max-w-[500px] text-3xl font-semibold leading-9 text-[#27272a]">
          Products that prioritizes experience &amp; boosts efficiency
        </h2>
        <Link
          href="#contact"
          className="inline-flex w-fit shrink-0 items-center rounded-xl bg-[#27272a] px-6 py-3 text-sm font-bold text-white"
        >
          Check our product suite
        </Link>
      </Reveal>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex w-full flex-col gap-6 lg:h-fit lg:flex-1 lg:overflow-y-auto lg:pr-1 scrollbar-none ">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} index={index} {...feature} />
          ))}
        </div>
        <WorkspacePreviewCard />
      </div>
    </div>
  );
}
