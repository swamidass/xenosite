/**
 * Path navigation helpers for metabolite generation breadcrumbs.
 */

import {
  moleculeFocusUrl,
  type FocusGeneration,
} from "~/utils/metabolitePath";
import { moleculePathLabel } from "~/utils/moleculeIdentity";

export type PathCrumb = {
  depth: number;
  /** Visible label (never raw SMILES). */
  label: string;
  /** Full SMILES / query for tooltip. */
  title?: string;
  /** Navigate here when clicked (omit for current hop). */
  href?: string;
  current: boolean;
};

export type PathCrumbSource = {
  generations: FocusGeneration[];
  /** Parallel resolved names when available (root + nested). */
  names?: Array<{ name?: string | null } | string | null | undefined>;
};

/** Prefer a human query token; never use SMILES-like strings as crumb text. */
export function rootQueryPathLabel(query: string): string {
  const q = (query || "").trim();
  if (!q) return "Molecule";
  // Name-like: letters, spaces, hyphens; no SMILES punctuation.
  if (/^[A-Za-z][A-Za-z0-9\- ]{0,39}$/.test(q) && !/[=#\[\]\(\)]/.test(q)) {
    return moleculePathLabel(q, "Molecule");
  }
  return "Molecule";
}

/**
 * Build breadcrumb crumbs for a generation stack.
 * Clicking crumb i jumps to generations.slice(0, i + 1).
 */
export function buildPathCrumbs(source: PathCrumbSource): PathCrumb[] {
  const { generations, names } = source;
  if (!generations?.length) return [];

  return generations.map((g, i) => {
    const nameInfo = names?.[i];
    const label =
      i === 0
        ? moleculePathLabel(nameInfo ?? null, rootQueryPathLabel(g.query))
        : moleculePathLabel(nameInfo ?? null, "Metabolite");
    const current = i === generations.length - 1;
    return {
      depth: i,
      label,
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
