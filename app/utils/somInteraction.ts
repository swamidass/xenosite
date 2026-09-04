/**
 * Pure helpers for SOM hover preview + toggle unselect behavior.
 */

import type { SiteSelection } from "~/utils/metabolites";
import type { SiteHit } from "~/utils/siteHitTest";
import type { SomHighlight } from "~/utils/somOverlay";
import {
  moleculeFocusUrl,
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
 * Panel selection: committed path/URL wins; hover previews only when no
 * downstream metabolite is selected.
 */
export function effectiveMetabolitePanelSelection(opts: {
  childQuery?: string | null;
  committed: SiteSelection | null;
  hover: SiteSelection | null;
}): SiteSelection | null {
  if (opts.childQuery) return opts.committed;
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
 * Navigate to this generation with an optional SOM selection, dropping any
 * deeper metabolite hops. Used when a child metabolite is selected and the
 * user clicks a SOM on the parent depiction.
 */
export function somSelectUrl(opts: {
  generations: FocusGeneration[];
  depth: number;
  atomIdxs?: number[];
  bondIdx?: number | null;
  head?: string | null;
}): string {
  const gens = opts.generations.slice(0, opts.depth + 1);
  const path = moleculeFocusUrl({ generations: gens });
  const search = new URLSearchParams();
  for (const a of opts.atomIdxs || []) {
    search.append("atom", String(a));
  }
  if (opts.bondIdx != null && Number.isInteger(opts.bondIdx)) {
    search.set("bond", String(opts.bondIdx));
  }
  if (opts.head) search.set("head", opts.head);
  const q = search.toString();
  return q ? `${path}?${q}` : path;
}

/**
 * Selecting the already-active metabolite pops that hop; otherwise append.
 */
export function metaboliteSelectUrl(opts: {
  generations: FocusGeneration[];
  depth: number;
  metaboliteSmiles: string;
  childQuery?: string | null;
}): string {
  const { generations, depth, metaboliteSmiles, childQuery } = opts;
  const base = generations.slice(0, depth + 1);
  if (childQuery && childQuery === metaboliteSmiles) {
    return moleculeFocusUrl({ generations: base });
  }
  return moleculeFocusUrl({
    generations: [
      ...base,
      {
        model: base[base.length - 1]?.model || "",
        query: metaboliteSmiles,
      },
    ],
  });
}
