/**
 * Pure helpers for SOM hover preview + toggle unselect behavior.
 */

import type { SiteSelection } from "~/utils/metabolites";
import type { SiteHit } from "~/utils/siteHitTest";
import type { SomHighlight } from "~/utils/somOverlay";
import {
  canAppendMetaboliteHop,
  moleculeFocusUrl,
  selectMetaboliteGeneration,
  withGenerationSom,
  type FocusGeneration,
} from "~/utils/metabolitePath";

export function hitToSiteSelection(
  hit: SiteHit | null | undefined,
): SiteSelection | null {
  if (!hit) return null;
  return {
    atomIdxs: hit.atomIdxs,
    bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
  };
}

export function highlightToSiteSelection(
  highlight: SomHighlight | null | undefined,
): SiteSelection | null {
  if (!highlight) return null;
  if (!highlight.atomIdxs?.length && highlight.bondIdx == null) return null;
  return {
    atomIdxs: highlight.atomIdxs || [],
    bondIdx: highlight.bondIdx,
  };
}

/**
 * Panel selection: committed path/URL wins; hover previews when present.
 * When a child hop is selected, only hover filters the browse grid (null =
 * show the full ranked list for "Show metabolites").
 */
export function effectiveMetabolitePanelSelection(opts: {
  childQuery?: string | null;
  committed: SiteSelection | null;
  hover: SiteSelection | null;
  /** @deprecated Unused — kept for call-site compat. */
  siteSelection?: SiteSelection | null;
}): SiteSelection | null {
  if (opts.childQuery) return opts.hover ?? null;
  return opts.hover || opts.committed;
}

export function sameSomHighlight(
  a: SomHighlight | null | undefined,
  b: SomHighlight | null | undefined,
): boolean {
  if (!a || !b) return false;
  if (a.bondIdx !== b.bondIdx) return false;
  if (a.atomIdxs.length !== b.atomIdxs.length) return false;
  return a.atomIdxs.every((x, i) => x === b.atomIdxs[i]);
}

/** Clicking the already-selected SOM clears it (returns null). */
export function toggleSomHighlight(
  current: SomHighlight | null | undefined,
  next: SomHighlight | null,
): SomHighlight | null {
  if (!next) return null;
  if (sameSomHighlight(current, next)) return null;
  return next;
}

/**
 * Pair / multisite models: click atoms to build a 1–2 atom selection.
 * Clicking a selected atom removes it; a third atom starts a new pair.
 */
export function applyPairAtomClick(
  current: SomHighlight | null | undefined,
  hit: SiteHit | null,
): SomHighlight | null {
  if (!hit) return null;
  const idx = hit.atomIdxs[0];
  if (idx == null || !Number.isInteger(idx)) return null;
  const cur = [...(current?.atomIdxs || [])].filter((n) => Number.isInteger(n));
  const pos = cur.indexOf(idx);
  if (pos >= 0) {
    cur.splice(pos, 1);
    return cur.length ? { atomIdxs: cur } : null;
  }
  if (cur.length >= 2) {
    return { atomIdxs: [idx] };
  }
  cur.push(idx);
  cur.sort((a, b) => a - b);
  return { atomIdxs: cur };
}

/**
 * Navigate to this generation with an optional SOM on its mol stub, dropping
 * any deeper metabolite hops. Head filter may remain as `?head=` when provided.
 */
export function somSelectUrl(opts: {
  generations: FocusGeneration[];
  depth: number;
  atomIdxs?: number[];
  bondIdx?: number | null;
  head?: string | null;
}): string {
  const gens = withGenerationSom(
    opts.generations,
    opts.depth,
    opts.atomIdxs,
    opts.bondIdx,
  );
  const path = moleculeFocusUrl({ generations: gens });
  if (!opts.head) return path;
  const search = new URLSearchParams();
  search.set("head", opts.head);
  return `${path}?${search}`;
}

/**
 * Selecting the already-active metabolite pops that hop; otherwise select/replace
 * the child hop, preserving an existing child's prediction model.
 * Formation site is written onto the parent mol stub.
 */
export function metaboliteSelectUrl(opts: {
  generations: FocusGeneration[];
  depth: number;
  metaboliteSmiles: string;
  childQuery?: string | null;
  headIndex?: number | null;
  site?: number[];
  matchIndex?: number | null;
  search?: string;
}): string {
  const {
    generations,
    depth,
    metaboliteSmiles,
    childQuery,
    headIndex,
    site,
    matchIndex,
    search,
  } = opts;
  const base = generations.slice(0, depth + 1);
  if (childQuery && childQuery === metaboliteSmiles) {
    return moleculeFocusUrl({ generations: base });
  }
  if (!canAppendMetaboliteHop(depth) && !generations[depth + 1]) {
    return moleculeFocusUrl({ generations: base });
  }
  return moleculeFocusUrl({
    generations: selectMetaboliteGeneration(
      generations,
      depth,
      metaboliteSmiles,
      { headIndex, site, matchIndex },
    ),
    search,
  });
}
