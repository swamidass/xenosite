/**
 * Human-readable generation / path-hop labels.
 *
 * Path stack depth is 0-based:
 * - depth 0 = substrate (starting molecule)
 * - depth 1 = Generation 1 (first metabolite hop), etc.
 *
 * Section banners label the metabolites *produced by* the molecule at `depth`,
 * so they use Generation (depth + 1).
 */

/** Substrate / parent hop at the root of the path. */
export const SUBSTRATE_LABEL = "Substrate";

/** 1-based generation index for metabolites descending from path depth `depth`. */
export function generationNumber(depth: number): number {
  const n = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 0;
  return n + 1;
}

/**
 * Banner / section label for metabolites under the molecule at `depth`:
 * "Generation 1", "Generation 2", …
 */
export function generationMarkerLabel(depth: number): string {
  return `Generation ${generationNumber(depth)}`;
}

/** Short aria/title text for a generation section. */
export function generationSectionLabel(depth: number): string {
  return generationMarkerLabel(depth);
}

/**
 * Path breadcrumb label for the hop at `depth`.
 * Root is Substrate; nested hops are Generation 1, Generation 2, …
 */
export function pathHopLabel(depth: number): string {
  const n = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 0;
  if (n === 0) return SUBSTRATE_LABEL;
  return `Generation ${n}`;
}
