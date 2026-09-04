/** Human-readable generation index for cross-UI markers (Gen 0, Gen 1, …). */
export function generationMarkerLabel(depth: number): string {
  const n = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 0;
  return `Gen ${n}`;
}

/** Short aria/title text for a generation section. */
export function generationSectionLabel(depth: number): string {
  return depth <= 0 ? "Parent molecule" : `Metabolite generation ${depth}`;
}
