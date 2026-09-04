import { Link } from "@remix-run/react";
import { generationMarkerLabel } from "~/utils/generationMarker";
import type { PathCrumb } from "~/utils/pathNav";
import { classNames } from "~/utils";

export type MetabolitePathNavProps = {
  crumbs: PathCrumb[];
  className?: string;
};

/**
 * Sticky top path bar for metabolite generation stacks.
 */
export default function MetabolitePathNav({
  crumbs,
  className,
}: MetabolitePathNavProps) {
  if (!crumbs.length || crumbs.length < 2) return null;

  return (
    <nav
      aria-label="Metabolite path"
      className={classNames(
        "sticky top-0 z-40 border-b border-gray-800 bg-black text-white shadow-sm",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 list-none m-0 px-3 py-2.5 max-w-screen-xl mx-auto min-h-[2.5rem]">
        {crumbs.map((c, i) => (
          <li key={`${c.depth}-${c.label}`} className="flex items-center gap-2 text-sm">
            {i > 0 ? (
              <span className="text-gray-500" aria-hidden>
                /
              </span>
            ) : null}
            {c.current || !c.href ? (
              <span
                title={c.title}
                aria-current="page"
                className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5"
              >
                <span className="font-semibold whitespace-nowrap">
                  {generationMarkerLabel(c.depth)}
                </span>
                <span className="text-gray-300 truncate max-w-[10rem] sm:max-w-[14rem]">
                  {c.label}
                </span>
              </span>
            ) : (
              <Link
                to={c.href}
                title={c.title}
                className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 min-h-[2rem] text-gray-200 hover:text-white underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
              >
                <span className="font-medium whitespace-nowrap">
                  {generationMarkerLabel(c.depth)}
                </span>
                <span className="text-gray-400 truncate max-w-[10rem] sm:max-w-[14rem]">
                  {c.label}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
