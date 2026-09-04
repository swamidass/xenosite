import { Link } from "@remix-run/react";
import GenerationMarker from "~/components/GenerationMarker";
import type { PathCrumb } from "~/utils/pathNav";
import { classNames } from "~/utils";

export type MetabolitePathNavProps = {
  crumbs: PathCrumb[];
  className?: string;
};

/**
 * Breadcrumb / chip trail for metabolite generation stacks.
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
        "w-full max-w-screen-md mx-auto px-2 py-2 overflow-x-auto",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center justify-center gap-2 list-none m-0 p-0 min-h-[2rem]">
        {crumbs.map((c, i) => (
          <li key={`${c.depth}-${c.label}`} className="flex items-center gap-2">
            {i > 0 ? (
              <span className="text-gray-300 text-xs" aria-hidden>
                /
              </span>
            ) : null}
            {c.current || !c.href ? (
              <span title={c.title} aria-current="page">
                <GenerationMarker depth={c.depth} label={c.label} />
              </span>
            ) : (
              <Link
                to={c.href}
                title={c.title}
                className="min-h-[2rem] inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                <GenerationMarker
                  depth={c.depth}
                  label={c.label}
                  className="hover:border-gray-400 hover:bg-gray-50"
                />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
