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
  radiusFactor = 0.35,
): number | null {
  const r = scale * radiusFactor;
  const r2 = r * r;
  let best: number | null = null;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = dist2(x, y, coords[i][0], coords[i][1]);
    if (d <= r2 && d < bestD) {
      bestD = d;
      best = i;
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
  radiusFactor = 0.15,
): number | null {
  const r = scale * radiusFactor;
  let best: number | null = null;
  let bestD = Infinity;
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
    if (d <= r && d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Prefer atoms when mode allows; otherwise bonds. Mode filters which hits count.
 */
export function resolveHit(
  x: number,
  y: number,
  opts: ResolveHitOptions,
): SiteHit | null {
  const {
    coords,
    bondsIdx,
    scale,
    mode,
    atomRadiusFactor = 0.35,
    bondRadiusFactor = 0.15,
  } = opts;

  const allowAtom = mode === "atom" || mode === "atom+bond" || mode === "pair";
  const allowBond = mode === "bond" || mode === "atom+bond";

  if (allowAtom) {
    const atom = hitTestAtom(x, y, coords, scale, atomRadiusFactor);
    if (atom != null) {
      return { kind: "atom", atomIdxs: [atom] };
    }
  }

  if (allowBond) {
    const bond = hitTestBond(x, y, coords, bondsIdx, scale, bondRadiusFactor);
    if (bond != null) {
      const [a, b] = bondsIdx[bond];
      return { kind: "bond", atomIdxs: [a, b], bondIdx: bond };
    }
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
