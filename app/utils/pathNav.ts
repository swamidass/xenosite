/**
 * Path navigation helpers for metabolite generation breadcrumbs.
 */

import {
  moleculeFocusUrl,
  type FocusGeneration,
} from "~/utils/metabolitePath";
import { pathHopLabel } from "~/utils/generationMarker";

export type PathCrumb = {
  depth: number;
  /** Visible hop label (Substrate / Generation N) — never a molecule name. */
  label: string;
  /** Full SMILES / query for tooltip. */
  title?: string;
  /** Navigate here when clicked (omit for current hop). */
  href?: string;
  current: boolean;
};

export type PathCrumbSource = {
  generations: FocusGeneration[];
};

/**
 * Build breadcrumb crumbs for a generation stack.
 * Clicking crumb i jumps to generations.slice(0, i + 1).
 * Labels are Substrate / Generation N only (no molecule names).
 */
export function buildPathCrumbs(source: PathCrumbSource): PathCrumb[] {
  const { generations } = source;
  if (!generations?.length) return [];

  return generations.map((g, i) => {
    const current = i === generations.length - 1;
    return {
      depth: i,
      label: pathHopLabel(i),
      title: g.query,
      current,
      href: current
        ? undefined
        : moleculeFocusUrl({ generations: generations.slice(0, i + 1) }),
    };
  });
}

/** URL after unselecting the leaf metabolite (pop one hop). */
export function popGenerationUrl(generations: FocusGeneration[]): string | null {
  if (!generations || generations.length < 2) return null;
  return moleculeFocusUrl({
    generations: generations.slice(0, generations.length - 1),
  });
}

/** URL after unselecting the metabolite at `depth` (keep ancestors only). */
export function trimGenerationsUrl(
  generations: FocusGeneration[],
  depth: number,
): string {
  const end = Math.max(1, Math.min(depth, generations.length));
  return moleculeFocusUrl({ generations: generations.slice(0, end) });
}
