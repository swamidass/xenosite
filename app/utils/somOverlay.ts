/**
 * SOM overlay mark geometry in SVG user units (scales with depiction).
 * Sized to read clearly on typical xenopict scales (~20).
 */
export function somStrokeWidths(scale: number): {
  black: number;
  white: number;
} {
  return { black: scale * 0.35, white: scale * 0.22 };
}

/** Circle radius for atom marks (SVG user units). */
export function somAtomRadius(scale: number): number {
  return scale * 0.55;
}

export type SomHighlight = {
  atomIdxs: number[];
  bondIdx?: number | null;
};

export type OverlayMark =
  | { kind: "atom"; x: number; y: number }
  | {
      kind: "bond";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };

/**
 * Build overlay mark primitives for a highlight against depiction coords.
 * Bond highlights also include endpoint atom marks so the site reads clearly.
 */
export function buildOverlayMarks(
  highlight: SomHighlight | null | undefined,
  coords: [number, number][],
  bondsIdx: [number, number][],
): OverlayMark[] {
  if (!highlight?.atomIdxs?.length) return [];
  const marks: OverlayMark[] = [];

  if (
    highlight.bondIdx != null &&
    highlight.bondIdx >= 0 &&
    highlight.bondIdx < bondsIdx.length
  ) {
    const [a, b] = bondsIdx[highlight.bondIdx];
    if (
      a >= 0 &&
      b >= 0 &&
      a < coords.length &&
      b < coords.length
    ) {
      marks.push({
        kind: "bond",
        x1: coords[a][0],
        y1: coords[a][1],
        x2: coords[b][0],
        y2: coords[b][1],
      });
      marks.push({ kind: "atom", x: coords[a][0], y: coords[a][1] });
      marks.push({ kind: "atom", x: coords[b][0], y: coords[b][1] });
      return marks;
    }
  }

  for (const idx of highlight.atomIdxs) {
    if (idx < 0 || idx >= coords.length) continue;
    marks.push({ kind: "atom", x: coords[idx][0], y: coords[idx][1] });
  }
  return marks;
}

/** Normalize API bonds.idx into [a,b] pairs. */
export function normalizeBondsIdx(raw: unknown): [number, number][] {
  if (!Array.isArray(raw)) return [];
  const out: [number, number][] = [];
  for (const entry of raw) {
    if (
      Array.isArray(entry) &&
      entry.length >= 2 &&
      Number.isFinite(Number(entry[0])) &&
      Number.isFinite(Number(entry[1]))
    ) {
      out.push([Number(entry[0]), Number(entry[1])]);
    }
  }
  return out;
}
