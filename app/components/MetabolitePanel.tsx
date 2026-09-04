import { useEffect, useMemo, useState } from "react";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import {
  formatPathwayLabel,
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";
import { moleculeDisplayName } from "~/utils/moleculeIdentity";
import { classNames } from "~/utils";

export type MetabolitePanelProps = {
  metabolites: MetaboliteRecord[] | null | undefined;
  selection?: SiteSelection | null;
  onSelectMetabolite: (m: MetaboliteRecord) => void;
  onHoverMetabolite?: (m: MetaboliteRecord | null) => void;
  /** Generation depth that owns this panel (for markers). */
  depth?: number;
  /** SMILES of the currently selected child metabolite (click again to unselect). */
  selectedSmiles?: string | null;
};

function labelFor(m: MetaboliteRecord): string {
  return moleculeDisplayName(m.name);
}

/**
 * Metabolites below a generation's predictions.
 * When a child hop is selected, shows only that metabolite (not "Top metabolites").
 */
export default function MetabolitePanel({
  metabolites,
  selection,
  onSelectMetabolite,
  onHoverMetabolite,
  selectedSmiles = null,
}: MetabolitePanelProps) {
  const [removedSmiles, setRemovedSmiles] = useState<Set<string>>(
    () => new Set(),
  );
  const pathSelected = !!selectedSmiles;

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

  const { shown: pool } = rankMetabolites(metabolites, {
    selection,
    cap: METABOLITE_DISPLAY_CAP * 4,
  });
  const shown = pool
    .filter((m) => !removedSmiles.has(m.smiles))
    .slice(0, pathSelected ? 1 : METABOLITE_DISPLAY_CAP);

  if (!shown.length) return null;

  return (
    <section
      className={classNames(
        "w-full mx-auto",
        pathSelected ? "mt-4 pt-2" : "mt-6 pt-6 border-t border-gray-300",
      )}
      aria-label={pathSelected ? "Selected metabolite" : "Top metabolites"}
    >
      {pathSelected ? null : (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 px-2">
          <h2 className="text-sm font-semibold text-gray-700 m-0">
            Top metabolites
          </h2>
        </div>
      )}
      <ul className="flex mx-auto mb-4 justify-center flex-wrap gap-4 list-none p-0 m-0">
        {shown.map((m) => {
          const name = labelFor(m);
          const selected = !!selectedSmiles && selectedSmiles === m.smiles;
          return (
            <li key={m.smiles} className="mx-2">
              <button
                type="button"
                className={classNames(
                  "block text-center rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                  selected
                    ? "ring-2 ring-gray-400 bg-gray-50"
                    : "hover:bg-gray-50",
                )}
                aria-pressed={selected}
                title={
                  selected ? "Click again to deselect" : undefined
                }
                onClick={() => onSelectMetabolite(m)}
                onMouseEnter={() => onHoverMetabolite?.(m)}
                onMouseLeave={() => onHoverMetabolite?.(null)}
                onFocus={() => onHoverMetabolite?.(m)}
                onBlur={() => onHoverMetabolite?.(null)}
              >
                <LazyMetaboliteImg
                  smiles={m.smiles}
                  alt={name || m.smiles}
                  onDepictError={() => {
                    setRemovedSmiles((prev) => {
                      if (prev.has(m.smiles)) return prev;
                      const next = new Set(prev);
                      next.add(m.smiles);
                      return next;
                    });
                  }}
                />
                {name ? (
                  <div className="text-center w-100 text-xs text-gray-500 mt-1">
                    {name}
                  </div>
                ) : (
                  <div className="h-4 mt-1" aria-hidden />
                )}
                <div
                  className={classNames(
                    "text-center",
                    selected
                      ? "text-xs text-gray-700 font-medium"
                      : "text-[10px] text-gray-400",
                  )}
                >
                  {m.pathway ? (
                    <div>{formatPathwayLabel(m.pathway)}</div>
                  ) : null}
                  {typeof m.score === "number" ? (
                    <div>{m.score.toFixed(2)}</div>
                  ) : null}
                </div>
                {selected ? (
                  <div className="text-center text-[10px] text-gray-500 mt-0.5">
                    Click to deselect
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
