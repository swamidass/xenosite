import { Link } from "@remix-run/react";
import type { PathCrumb } from "~/utils/pathNav";
import { classNames } from "~/utils";

export type MetabolitePathNavProps = {
  crumbs: PathCrumb[];
  className?: string;
};

/**
 * Sticky top path bar for metabolite generation stacks.
 * Crumbs are Substrate / Generation N only (no molecule names).
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
          <li key={c.depth} className="flex items-center gap-2 text-sm">
            {i > 0 ? (
              <span className="text-gray-500" aria-hidden>
                /
              </span>
            ) : null}
            {c.current || !c.href ? (
              <span
                title={c.title}
                aria-current="page"
                className="font-semibold whitespace-nowrap"
              >
                {c.label}
              </span>
            ) : (
              <Link
                to={c.href}
                title={c.title}
                className="min-h-[2rem] inline-flex items-center font-medium whitespace-nowrap text-gray-200 hover:text-white underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
              >
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
