import { Link } from "@remix-run/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import {
  formatPathwayLabel,
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";
import {
  metabolitePanelChrome,
  metabolitesExpandedByDefault,
} from "~/utils/metabolitePanelView";
import { moleculeDisplayName } from "~/utils/moleculeIdentity";
import { compensateScrollForAnchorShift } from "~/utils/scrollAnchor";
import { classNames } from "~/utils";

export type MetabolitePanelProps = {
  metabolites: MetaboliteRecord[] | null | undefined;
  selection?: SiteSelection | null;
  /** Per-atom CIP ranks (`atoms.cipRank`) for topological site matching. */
  cipRank?: number[] | null;
  /** Remix path (+ search) for selecting this metabolite hop. */
  hrefForMetabolite: (m: MetaboliteRecord) => string;
  /** Remix path that pops the selected hop (Clear). */
  clearHref?: string | null;
  onHoverMetabolite?: (m: MetaboliteRecord | null) => void;
  /** Generation depth that owns this panel (for markers). */
  depth?: number;
  /**
   * SMILES of the currently selected child metabolite.
   * When set, the card grid is collapsed by default; no selected card is shown.
   */
  selectedSmiles?: string | null;
  /**
   * True while SOM hover is preview-filtering the grid. Locks min-height to the
   * pre-hover size so the page does not bounce as the list shrinks/grows.
   */
  lockLayout?: boolean;
  /**
   * False when this panel is already at the nested-hop depth cap and selecting
   * a metabolite cannot open another generation.
   */
  canSelectNextGeneration?: boolean;
};

function labelFor(m: MetaboliteRecord): string {
  return moleculeDisplayName(m.name);
}

/**
 * Metabolites below a generation's predictions.
 * Selection is a Remix <Link> to the next paired {model}/{query} hop.
 */
export default function MetabolitePanel({
  metabolites,
  selection,
  cipRank = null,
  hrefForMetabolite,
  clearHref = null,
  onHoverMetabolite,
  selectedSmiles = null,
  lockLayout = false,
  canSelectNextGeneration = true,
}: MetabolitePanelProps) {
  const [removedSmiles, setRemovedSmiles] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelection = !!selectedSmiles;
  const [expanded, setExpanded] = useState(() =>
    metabolitesExpandedByDefault(hasSelection),
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const baselineHeightRef = useRef(0);
  const anchorTopRef = useRef<number | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Collapse on first select; reopen when cleared. Replacing the selected
    // metabolite (same hasSelection) must not collapse an open browse grid.
    setExpanded(metabolitesExpandedByDefault(hasSelection));
  }, [hasSelection]);

  const poolKey = useMemo(() => {
    // Parent passes null while a child hop is selected and nothing is hovered
    // (full list). A hover SiteSelection filters the browse grid.
    const { shown } = rankMetabolites(metabolites, {
      selection,
      cipRank,
      cap: METABOLITE_DISPLAY_CAP * 4,
    });
    return shown.map((m) => m.smiles).join("|");
  }, [metabolites, selection, cipRank]);

  useEffect(() => {
    setRemovedSmiles(new Set());
  }, [poolKey]);

  const { shown: pool } = rankMetabolites(metabolites, {
    selection,
    cipRank,
    cap: METABOLITE_DISPLAY_CAP * 4,
  });
  const shown = pool
    .filter((m) => !removedSmiles.has(m.smiles))
    .slice(0, METABOLITE_DISPLAY_CAP);

  const chrome = metabolitePanelChrome({
    hasSelection,
    expanded,
    hasMetabolites: shown.length > 0,
  });

  // Only compensate scroll for hover-filter layout lock — not expand/collapse.
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (!lockLayout) {
      baselineHeightRef.current = el.offsetHeight;
      setMinHeight(undefined);
      return;
    }

    if (baselineHeightRef.current > 0) {
      setMinHeight(baselineHeightRef.current);
    }
    const top = el.getBoundingClientRect().top;
    anchorTopRef.current = compensateScrollForAnchorShift(
      anchorTopRef.current,
      top,
    );
  }, [lockLayout, poolKey, shown.length]);

  useLayoutEffect(() => {
    if (!lockLayout) {
      anchorTopRef.current = null;
    }
  }, [lockLayout]);

  if (!shown.length && !hasSelection) return null;

  return (
    <section
      ref={sectionRef}
      className="w-full mx-auto mt-2"
      aria-label="Metabolites"
      style={{
        minHeight: lockLayout && minHeight ? minHeight : undefined,
        overflowAnchor: "none",
      }}
    >
      {chrome.showToggle ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2 px-2">
          <button
            type="button"
            className="text-xs text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline min-h-[2rem] px-1"
            aria-expanded={expanded}
            onClick={() => {
              // Intentional expand/collapse — do not scroll-compensate.
              anchorTopRef.current = null;
              setExpanded((v) => !v);
            }}
          >
            {chrome.toggleLabel}
          </button>
          {chrome.showClear && clearHref ? (
            <Link
              to={clearHref}
              preventScrollReset
              className="text-xs text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline min-h-[2rem] inline-flex items-center px-1"
            >
              Clear
            </Link>
          ) : null}
        </div>
      ) : null}

      {chrome.showGrid ? (
        <>
          <ul
            className={classNames(
              "flex mx-auto justify-center flex-wrap gap-4 list-none p-0 m-0",
              hasSelection ? "mb-4" : "mb-2",
            )}
          >
            {shown.map((m) => {
              const name = labelFor(m);
              const isCurrent = !!selectedSmiles && selectedSmiles === m.smiles;
              const href = hrefForMetabolite(m);
              return (
                <li key={m.smiles} className="mx-2">
                  <Link
                    to={href}
                    preventScrollReset
                    className={classNames(
                      "block text-center rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 hover:bg-gray-50",
                      isCurrent ? "opacity-60" : null,
                    )}
                    aria-current={isCurrent ? "page" : undefined}
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
                    <div className="text-center text-[10px] text-gray-400">
                      {m.pathway ? (
                        <div>{formatPathwayLabel(m.pathway)}</div>
                      ) : null}
                      {typeof m.score === "number" ? (
                        <div>{m.score.toFixed(2)}</div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {!hasSelection ? (
            <p className="mb-4 px-3 text-center text-xs text-gray-400">
              {canSelectNextGeneration
                ? "Select a metabolite to form the next generation."
                : "Maximum generation reached — metabolites here can't start another hop."}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
