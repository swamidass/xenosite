import { useEffect, useMemo, useState } from "react";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import { capitalize } from "~/utils";
import {
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";

export type MetabolitePanelProps = {
  metabolites: MetaboliteRecord[] | null | undefined;
  selection?: SiteSelection | null;
  onSelectMetabolite: (m: MetaboliteRecord) => void;
  onHoverMetabolite?: (m: MetaboliteRecord | null) => void;
  /** When a path metabolite is focused, hide the grid (siblings removed). */
  hideWhenPathSelected?: boolean;
  pathMetaboliteSmiles?: string | null;
};

function labelFor(m: MetaboliteRecord): string {
  const n = m.name?.name;
  if (n) return capitalize(n);
  return m.smiles;
}

/**
 * Top metabolites (≤5) below the focus molecule. Click navigates; hover highlights SOM.
 * If /depict fails for a candidate, log and drop it from the list (backfill from pool).
 */
export default function MetabolitePanel({
  metabolites,
  selection,
  onSelectMetabolite,
  onHoverMetabolite,
  hideWhenPathSelected,
  pathMetaboliteSmiles,
}: MetabolitePanelProps) {
  const [removedSmiles, setRemovedSmiles] = useState<Set<string>>(
    () => new Set(),
  );

  // Reset when the candidate pool changes (new molecule / selection).
  const poolKey = useMemo(() => {
    const { shown } = rankMetabolites(metabolites, {
      selection,
      cap: METABOLITE_DISPLAY_CAP * 4,
    });
    return shown.map((m) => m.smiles).join("|");
  }, [metabolites, selection]);

  useEffect(() => {
    setRemovedSmiles(new Set());
  }, [poolKey]);

  if (hideWhenPathSelected && pathMetaboliteSmiles) {
    return null;
  }

  const { shown: pool } = rankMetabolites(metabolites, {
    selection,
    cap: METABOLITE_DISPLAY_CAP * 4,
  });
  const shown = pool
    .filter((m) => !removedSmiles.has(m.smiles))
    .slice(0, METABOLITE_DISPLAY_CAP);

  if (!shown.length) return null;

  return (
    <section className="mt-8 w-full max-w-3xl mx-auto px-2" aria-label="Metabolites">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        Top metabolites
      </h2>
      <ul className="flex flex-wrap justify-center gap-4 list-none p-0 m-0">
        {shown.map((m) => (
          <li key={m.smiles} className="w-36 sm:w-40">
            <button
              type="button"
              className="w-full text-left border border-transparent hover:border-gray-300 rounded p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              onClick={() => onSelectMetabolite(m)}
              onMouseEnter={() => onHoverMetabolite?.(m)}
              onMouseLeave={() => onHoverMetabolite?.(null)}
              onFocus={() => onHoverMetabolite?.(m)}
              onBlur={() => onHoverMetabolite?.(null)}
            >
              <LazyMetaboliteImg
                smiles={m.smiles}
                alt={labelFor(m)}
                onDepictError={() => {
                  setRemovedSmiles((prev) => {
                    if (prev.has(m.smiles)) return prev;
                    const next = new Set(prev);
                    next.add(m.smiles);
                    return next;
                  });
                }}
              />
              <div className="mt-2 text-xs text-center text-gray-700 break-all">
                {labelFor(m)}
              </div>
              {m.pathway ? (
                <div className="text-[10px] text-center text-gray-400">
                  {m.pathway}
                </div>
              ) : null}
              {typeof m.score === "number" ? (
                <div className="text-[10px] text-center text-gray-400">
                  {m.score.toFixed(2)}
                </div>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
