/**
 * Pure view-model helpers for the expandable metabolite panel.
 */

/** Depths with the metabolite grid open while a child hop is selected. */
export const METS_OPEN_PARAM = "open";
/** Depths showing the full uncapped metabolite list. */
export const METS_ALL_PARAM = "all";

export type MetabolitePanelChrome = {
  /** Show Show/Hide metabolites control. */
  showToggle: boolean;
  /** Render the ranked card grid. */
  showGrid: boolean;
  /** Show Clear while browsing a selection. */
  showClear: boolean;
  /** Label for the expand/collapse control. */
  toggleLabel: "Show metabolites" | "Hide metabolites" | null;
};

/**
 * Default expanded state when selection presence flips:
 * open with no selection; collapsed after the first select.
 */
export function metabolitesExpandedByDefault(hasSelection: boolean): boolean {
  return !hasSelection;
}

/**
 * Chrome for the panel given selection + user expand state + whether any
 * ranked metabolites exist to show.
 */
export function metabolitePanelChrome(opts: {
  hasSelection: boolean;
  expanded: boolean;
  hasMetabolites: boolean;
}): MetabolitePanelChrome {
  const { hasSelection, expanded, hasMetabolites } = opts;
  const showGrid = (!hasSelection || expanded) && hasMetabolites;
  return {
    showToggle: hasSelection,
    showGrid,
    showClear: hasSelection && expanded,
    toggleLabel: hasSelection
      ? expanded
        ? "Hide metabolites"
        : "Show metabolites"
      : null,
  };
}

/** True when `depth` appears in a comma-separated depth-set param. */
export function depthSetHas(
  params: URLSearchParams,
  key: string,
  depth: number,
): boolean {
  const raw = params.get(key);
  if (!raw) return false;
  return raw.split(",").some((p) => p.trim() === String(depth));
}

/** Add/remove one depth in a depth-set param (immutable). */
export function withDepthSet(
  params: URLSearchParams,
  key: string,
  depth: number,
  on: boolean,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = new Set(
    (next.get(key) || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s)),
  );
  const d = String(depth);
  if (on) set.add(d);
  else set.delete(d);
  const sorted = [...set].sort((a, b) => Number(a) - Number(b));
  if (sorted.length) next.set(key, sorted.join(","));
  else next.delete(key);
  return next;
}

/** Copy `open` / `all` into a new (or given) search — for Remix Link/navigate. */
export function keepPanelSearch(
  from: URLSearchParams | string,
  into: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const src =
    typeof from === "string"
      ? new URLSearchParams(from.startsWith("?") ? from.slice(1) : from)
      : from;
  for (const key of [METS_OPEN_PARAM, METS_ALL_PARAM]) {
    const v = src.get(key);
    if (v) into.set(key, v);
  }
  return into;
}

/**
 * Keep `open` / `all` depths at or below `maxDepth` (breadcrumb trim).
 * Drops SOM `atom` / `bond` / `head` — those belong to the leaf view.
 */
export function truncatePanelSearch(
  from: URLSearchParams | string,
  maxDepth: number,
): string {
  const src =
    typeof from === "string"
      ? new URLSearchParams(from.startsWith("?") ? from.slice(1) : from)
      : from;
  const into = new URLSearchParams();
  for (const key of [METS_OPEN_PARAM, METS_ALL_PARAM]) {
    const kept = (src.get(key) || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s) && Number(s) <= maxDepth)
      .map(Number);
    const formatted = [...new Set(kept)]
      .sort((a, b) => a - b)
      .join(",");
    if (formatted) into.set(key, formatted);
  }
  return into.toString();
}
