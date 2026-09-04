/**
 * Human-readable generation labels.
 * Depth is 0-based in the path stack; display numbers start at Generation 1.
 */
export function generationNumber(depth: number): number {
  const n = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 0;
  return n + 1;
}

/** Cross-UI label: "Generation 1", "Generation 2", … */
export function generationMarkerLabel(depth: number): string {
  return `Generation ${generationNumber(depth)}`;
}

/** Short aria/title text for a generation section. */
export function generationSectionLabel(depth: number): string {
  return generationMarkerLabel(depth);
}
