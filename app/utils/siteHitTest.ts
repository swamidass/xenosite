export type BondIdx = [number, number];

export type SiteHit =
  | { kind: "atom"; atomIdxs: number[]; bondIdx?: undefined }
  | { kind: "bond"; atomIdxs: number[]; bondIdx: number };

export type SelectionMode = "atom" | "bond" | "atom+bond" | "pair";

export type ResolveHitOptions = {
  coords: [number, number][];
  bondsIdx: BondIdx[];
  scale: number;
  mode: SelectionMode;
  atomRadiusFactor?: number;
  bondRadiusFactor?: number;
};

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** Distance from point P to segment AB. */
function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return Math.sqrt(dist2(px, py, ax, ay));
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.sqrt(dist2(px, py, cx, cy));
}

export function hitTestAtom(
  x: number,
  y: number,
  coords: [number, number][],
  scale: number,
  radiusFactor = 0.75,
): { idx: number; dist: number } | null {
  const r = scale * radiusFactor;
  const r2 = r * r;
  let best: { idx: number; dist: number } | null = null;
  for (let i = 0; i < coords.length; i++) {
    const d2 = dist2(x, y, coords[i][0], coords[i][1]);
    if (d2 <= r2 && (best == null || d2 < best.dist * best.dist)) {
      const dist = Math.sqrt(d2);
      best = { idx: i, dist };
    }
  }
  return best;
}

export function hitTestBond(
  x: number,
  y: number,
  coords: [number, number][],
  bondsIdx: BondIdx[],
  scale: number,
  radiusFactor = 0.4,
): { idx: number; dist: number } | null {
  const r = scale * radiusFactor;
  let best: { idx: number; dist: number } | null = null;
  for (let i = 0; i < bondsIdx.length; i++) {
    const [a, b] = bondsIdx[i];
    if (a < 0 || b < 0 || a >= coords.length || b >= coords.length) continue;
    const d = distToSegment(
      x,
      y,
      coords[a][0],
      coords[a][1],
      coords[b][0],
      coords[b][1],
    );
    if (d <= r && (best == null || d < best.dist)) {
      best = { idx: i, dist: d };
    }
  }
  return best;
}

/**
 * Resolve a pointer hit. In atom+bond mode, use a tighter atom radius and pick
 * whichever site (atom or bond) is closer so bond midpoints stay selectable.
 */
export function resolveHit(
  x: number,
  y: number,
  opts: ResolveHitOptions,
): SiteHit | null {
  const { coords, bondsIdx, scale, mode } = opts;

  const allowAtom = mode === "atom" || mode === "atom+bond" || mode === "pair";
  const allowBond = mode === "bond" || mode === "atom+bond";

  // Tighter atom targets when bonds compete for the same clicks.
  const atomRadiusFactor =
    opts.atomRadiusFactor ?? (mode === "atom+bond" ? 0.4 : 0.65);
  const bondRadiusFactor =
    opts.bondRadiusFactor ?? (mode === "atom+bond" ? 0.35 : 0.4);

  const atomHit = allowAtom
    ? hitTestAtom(x, y, coords, scale, atomRadiusFactor)
    : null;
  const bondHit = allowBond
    ? hitTestBond(x, y, coords, bondsIdx, scale, bondRadiusFactor)
    : null;

  if (atomHit && bondHit) {
    // Near an atom center, keep the atom; bond midpoints (farther from atoms) win otherwise.
    const atomCore = scale * atomRadiusFactor * 0.85;
    if (atomHit.dist <= atomCore) {
      return { kind: "atom", atomIdxs: [atomHit.idx] };
    }
    if (bondHit.dist < atomHit.dist) {
      const [a, b] = bondsIdx[bondHit.idx];
      return { kind: "bond", atomIdxs: [a, b], bondIdx: bondHit.idx };
    }
    return { kind: "atom", atomIdxs: [atomHit.idx] };
  }

  if (atomHit) {
    return { kind: "atom", atomIdxs: [atomHit.idx] };
  }

  if (bondHit) {
    const [a, b] = bondsIdx[bondHit.idx];
    return { kind: "bond", atomIdxs: [a, b], bondIdx: bondHit.idx };
  }

  return null;
}

export function selectionModeFromResult(result: {
  pair_idx?: unknown;
  atom?: unknown;
  bond?: unknown;
}): SelectionMode {
  if (Array.isArray(result.pair_idx)) return "pair";
  const hasAtom = Array.isArray(result.atom);
  const hasBond = Array.isArray(result.bond);
  if (hasAtom && hasBond) return "atom+bond";
  if (hasBond) return "bond";
  return "atom";
}
