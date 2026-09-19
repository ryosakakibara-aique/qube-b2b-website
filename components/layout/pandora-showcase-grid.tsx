import Link from "next/link";

type ShowcaseCellData = {
  id: string; // renamed from `key` — `key` is a reserved React prop name
  label: string;
  variant: "dark" | "light";
  gridClassName: string;
};

const cells: ShowcaseCellData[] = [
  {
    id: "terminals-1",
    label: "For Terminals",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-1",
  },
  {
    id: "laundry",
    label: "For Laundry businesses",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
  },
  {
    id: "qube-app",
    label: "QUBE App",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-2 lg:row-span-2",
  },
  {
    id: "qr-cash",
    label: "QR & Cash Payments",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-2",
  },
  {
    id: "data-config",
    label: "Data and Configuration",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-2",
  },
  {
    id: "terminals-2",
    label: "For Terminals",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-3",
  },
  {
    id: "real-time",
    label: "Real-time data",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-3",
  },
  {
    id: "recreational",
    label: "For Recreational areas",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:col-span-2 lg:row-start-4",
  },
  {
    id: "offices",
    label: "For Offices",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-4",
  },
];

// ShowcaseCell's prop type only needs the rendering fields
function ShowcaseCell({
  label,
  variant,
  gridClassName,
}: Omit<ShowcaseCellData, "id">) {
  const isDark = variant === "dark";
  return (
    <Link
      href="#"
      className={`group relative flex min-h-[220px] items-end overflow-hidden border ${
        isDark ? "border-[#27272a]" : "border-[#e5e7eb]"
      } lg:h-full lg:min-h-0 ${gridClassName}`}
    >
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-[#27272a]" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black from-[21.502%] to-[rgba(39,39,42,0)] to-[80.548%]"
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#f1f5f9] via-[#f1f5f9]/[0.51] via-[70.192%] to-[#f1f5f9]/0"
          aria-hidden="true"
        />
      )}
      <span
        className={`relative flex items-center gap-2 px-6 py-4 text-lg font-semibold transition-opacity group-hover:opacity-80 ${
          isDark ? "text-white" : "text-[#18181b]"
        }`}
      >
        {label}
        {/* <ArrowIcon /> */}
      </span>
    </Link>
  );
}

export function PandoraShowcaseGrid() {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[30px] border border-[#e5e7eb] lg:h-[1082px] lg:grid-cols-3 lg:grid-rows-4">
      {cells.map(({ id, ...cellProps }) => (
        <ShowcaseCell key={id} {...cellProps} />
      ))}
    </div>
  );
}
