import { Link, useSearchParams } from "@remix-run/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import PlotDot from "~/components/PlotDot";
import {
  formatPathwayLabel,
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";
import {
  METS_ALL_PARAM,
  METS_OPEN_PARAM,
  depthSetHas,
  metabolitePanelChrome,
  withDepthSet,
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
  /** Generation depth that owns this panel (for markers + `open`/`all` params). */
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
 * Panel open / show-all live in `?open=` / `?all=` (comma-separated depths).
 */
export default function MetabolitePanel({
  metabolites,
  selection,
  cipRank = null,
  hrefForMetabolite,
  clearHref = null,
  onHoverMetabolite,
  depth = 0,
  selectedSmiles = null,
  lockLayout = false,
  canSelectNextGeneration = true,
}: MetabolitePanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [removedSmiles, setRemovedSmiles] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelection = !!selectedSmiles;
  const showAll = depthSetHas(searchParams, METS_ALL_PARAM, depth);
  const expanded =
    !hasSelection ||
    depthSetHas(searchParams, METS_OPEN_PARAM, depth) ||
    showAll;

  const patchSearch = (update: (prev: URLSearchParams) => URLSearchParams) => {
    setSearchParams((prev) => update(new URLSearchParams(prev)), {
      replace: true,
      preventScrollReset: true,
    });
  };

  const sectionRef = useRef<HTMLElement | null>(null);
  const baselineHeightRef = useRef(0);
  const anchorTopRef = useRef<number | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  const { shown: ranked } = rankMetabolites(metabolites, {
    selection,
    cipRank,
    // Rank the full filtered set; UI caps display unless "show all".
    cap: Number.POSITIVE_INFINITY,
  });

  const poolKey = useMemo(
    () =>
      ranked
        .map(
          (m) =>
            `${m.smiles}\0${m.pathway || ""}\0${(m.atom || []).join(",")}`,
        )
        .join("|"),
    [ranked],
  );

  useEffect(() => {
    setRemovedSmiles(new Set());
  }, [poolKey]);

  const visiblePool = ranked.filter((m) => !removedSmiles.has(m.smiles));
  const shown = showAll
    ? visiblePool
    : visiblePool.slice(0, METABOLITE_DISPLAY_CAP);
  const hiddenCount = Math.max(0, visiblePool.length - shown.length);

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
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2 px-2 print:hidden">
          <button
            type="button"
            className="text-xs text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline min-h-[2rem] px-1"
            aria-expanded={expanded}
            onClick={() => {
              anchorTopRef.current = null;
              patchSearch((prev) => {
                let next = withDepthSet(
                  prev,
                  METS_OPEN_PARAM,
                  depth,
                  !expanded,
                );
                if (expanded) {
                  next = withDepthSet(next, METS_ALL_PARAM, depth, false);
                }
                return next;
              });
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
          {/* Keep a fixed hint slot above the grid so select/deselect doesn't jump layout. */}
          <div className="mb-2 px-3 min-h-[2.5rem] flex items-center justify-center print:hidden">
            <p
              className={classNames(
                "m-0 text-center text-xs text-gray-400",
                hasSelection && "invisible",
              )}
              aria-hidden={hasSelection || undefined}
            >
              {canSelectNextGeneration
                ? "Select a metabolite to form the next generation."
                : "Maximum generation reached — metabolites here can't start another hop."}
            </p>
          </div>
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
              const cardKey = [
                m.smiles,
                m.pathway || "",
                (m.atom || []).join(","),
                m.headIndex ?? "",
              ].join("\0");
              return (
                <li key={cardKey} className="mx-2">
                  <Link
                    to={href}
                    preventScrollReset
                    className={classNames(
                      "block text-center rounded px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 hover:bg-gray-50",
                      isCurrent ? "ring-1 ring-gray-300" : null,
                    )}
                    aria-current={isCurrent ? "page" : undefined}
                    onMouseEnter={() => onHoverMetabolite?.(m)}
                    onMouseLeave={() => onHoverMetabolite?.(null)}
                    onFocus={() => onHoverMetabolite?.(m)}
                    onBlur={() => onHoverMetabolite?.(null)}
                  >
                    <div className="relative mx-auto w-fit max-w-full">
                      <div className="relative z-20 -mb-3 flex flex-col items-center text-center text-[10px] leading-none">
                        {m.pathway ? (
                          <div className="metabolite-meta-label relative z-30">
                            {formatPathwayLabel(m.pathway)}
                          </div>
                        ) : null}
                        {typeof m.score === "number" ? (
                          <div className="relative z-10 inline-flex items-center justify-center py-0.5">
                            <PlotDot
                              value={m.score}
                              size={40}
                              className="pointer-events-none absolute left-[-130%] top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
                              title={`Probability ${m.score.toFixed(2)}`}
                            />
                            <div className="metabolite-meta-label relative z-10">
                              {m.score.toFixed(2)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="relative z-10 flex justify-center leading-none">
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
                      </div>
                    </div>
                    {name ? (
                      <div className="-mt-0.5 text-center text-xs leading-tight text-gray-500">
                        {name}
                      </div>
                    ) : (
                      <div className="h-3" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 || showAll ? (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2">
              {!showAll ? (
                <p className="text-xs text-gray-500">
                  Showing {shown.length} of {visiblePool.length} metabolite
                  {visiblePool.length === 1 ? "" : "s"}
                </p>
              ) : null}
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline min-h-[2rem] px-1 print:hidden"
                onClick={() => {
                  anchorTopRef.current = null;
                  patchSearch((prev) => {
                    let next = withDepthSet(
                      prev,
                      METS_ALL_PARAM,
                      depth,
                      !showAll,
                    );
                    if (!showAll) {
                      next = withDepthSet(next, METS_OPEN_PARAM, depth, true);
                    }
                    return next;
                  });
                }}
              >
                {showAll ? "Show only top five" : "Show all"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
