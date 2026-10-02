/**
 * Temporary: xpict JS ``svg_coords`` omit Rust heteroatom label padding, so
 * overlays drift (phenol OH). Until xpict frames labels correctly, fit a
 * separable affine map from painted prediction shade disks:
 *
 *   x' = xscale * x + xshift
 *   y' = yscale * y + yshift
 *
 * Shade disks may sit on atoms *or* bond midpoints (ndealk). Match against
 * both. With too few pairs, degrade gracefully (identity → translation →
 * full fit) — never hard-fail.
 */

import { XPICT_SCALE } from "~/utils/xpictShade";

export type Point = { x: number; y: number };

/** Separable map: ``x' = xscale*x + xshift``, ``y' = yscale*y + yshift``. */
export type CoordFit = {
  xscale: number;
  yscale: number;
  xshift: number;
  yshift: number;
};

/** @deprecated Prefer {@link CoordFit}; kept for call-site clarity. */
export type CoordShift = CoordFit;

/** Max distance (SVG units) to accept a shade↔target pairing. */
export const SHADE_MATCH_MAX = XPICT_SCALE * 0.75;

const CX_RE = /\bcx=["']([-\d.eE]+)["']/;
const CY_RE = /\bcy=["']([-\d.eE]+)["']/;
const AXIS_EPS = 1e-9;

export function identityCoordFit(): CoordFit {
  return { xscale: 1, yscale: 1, xshift: 0, yshift: 0 };
}

/** All ``class="shade"`` disks in an xpict SVG. */
export function parseShadeCircles(svg: string): Point[] {
  if (!svg) return [];
  const out: Point[] = [];
  const re = /<circle\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    const tag = m[0];
    if (!/\bclass=["']shade["']/.test(tag)) continue;
    const cx = tag.match(CX_RE)?.[1];
    const cy = tag.match(CY_RE)?.[1];
    if (cx == null || cy == null) continue;
    const x = Number(cx);
    const y = Number(cy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ x, y });
  }
  return out;
}

/** @deprecated Use {@link parseShadeCircles}; first disk only. */
export function parseFirstShadeCircle(svg: string): Point | null {
  return parseShadeCircles(svg)[0] ?? null;
}

/** Atom centers plus bond midpoints (where bond_shade disks are painted). */
export function shadeMatchTargets(
  coords: ReadonlyArray<readonly [number, number]>,
  bondsIdx?: ReadonlyArray<readonly [number, number]> | null,
): Point[] {
  const out: Point[] = [];
  for (const c of coords) {
    if (!c || c.length < 2) continue;
    if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
    out.push({ x: c[0], y: c[1] });
  }
  if (bondsIdx) {
    for (const bond of bondsIdx) {
      if (!bond || bond.length < 2) continue;
      const a = coords[bond[0]];
      const b = coords[bond[1]];
      if (!a || !b) continue;
      out.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 });
    }
  }
  return out;
}

/** Pair each shade with its nearest target within ``maxDist``. */
export function matchShadeTargets(
  shades: ReadonlyArray<Point>,
  targets: ReadonlyArray<Point>,
  maxDist: number = SHADE_MATCH_MAX,
): Array<{ src: Point; dst: Point }> {
  const pairs: Array<{ src: Point; dst: Point }> = [];
  if (!shades.length || !targets.length) return pairs;
  for (const shade of shades) {
    let bestD = Infinity;
    let best: Point | null = null;
    for (const t of targets) {
      const d = Math.hypot(shade.x - t.x, shade.y - t.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (best && bestD <= maxDist) pairs.push({ src: best, dst: shade });
  }
  return pairs;
}

/**
 * Least-squares ``dst ≈ scale*src + shift`` on one axis.
 * 0 samples → identity; 1 sample or no spread → scale=1, translation only.
 */
export function fitAxis(
  src: ReadonlyArray<number>,
  dst: ReadonlyArray<number>,
): { scale: number; shift: number } {
  const n = Math.min(src.length, dst.length);
  if (n < 1) return { scale: 1, shift: 0 };
  if (n === 1) return { scale: 1, shift: dst[0]! - src[0]! };

  let meanS = 0;
  let meanD = 0;
  for (let i = 0; i < n; i++) {
    meanS += src[i]!;
    meanD += dst[i]!;
  }
  meanS /= n;
  meanD /= n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const ds = src[i]! - meanS;
    num += ds * (dst[i]! - meanD);
    den += ds * ds;
  }
  if (den < AXIS_EPS) {
    return { scale: 1, shift: meanD - meanS };
  }
  const scale = num / den;
  return { scale, shift: meanD - scale * meanS };
}

/**
 * Fit ``(xscale,xshift,yscale,yshift)`` mapping raw coords → shade ink.
 * Always returns a fit (identity when there is nothing to match).
 */
export function shadeCoordFit(
  svg: string,
  coords: ReadonlyArray<readonly [number, number]>,
  bondsIdx?: ReadonlyArray<readonly [number, number]> | null,
  maxDist: number = SHADE_MATCH_MAX,
): CoordFit {
  const pairs = matchShadeTargets(
    parseShadeCircles(svg),
    shadeMatchTargets(coords, bondsIdx),
    maxDist,
  );
  if (!pairs.length) return identityCoordFit();

  const xs = pairs.map((p) => p.src.x);
  const xd = pairs.map((p) => p.dst.x);
  const ys = pairs.map((p) => p.src.y);
  const yd = pairs.map((p) => p.dst.y);
  const x = fitAxis(xs, xd);
  const y = fitAxis(ys, yd);
  return {
    xscale: x.scale,
    xshift: x.shift,
    yscale: y.scale,
    yshift: y.shift,
  };
}

/** @deprecated Use {@link shadeCoordFit}. */
export function shadeCoordShift(
  svg: string,
  coords: ReadonlyArray<readonly [number, number]>,
  bondsIdx?: ReadonlyArray<readonly [number, number]> | null,
  maxDist: number = SHADE_MATCH_MAX,
): CoordFit {
  return shadeCoordFit(svg, coords, bondsIdx, maxDist);
}

/** Apply a separable affine fit to index-aligned atom coords. */
export function applyCoordFit(
  coords: ReadonlyArray<readonly [number, number]>,
  fit: CoordFit | null | undefined,
): [number, number][] {
  const f = fit ?? identityCoordFit();
  const { xscale, yscale, xshift, yshift } = f;
  if (
    xscale === 1 &&
    yscale === 1 &&
    xshift === 0 &&
    yshift === 0
  ) {
    return coords.map((c) => [c[0], c[1]] as [number, number]);
  }
  return coords.map(
    (c) =>
      [xscale * c[0] + xshift, yscale * c[1] + yshift] as [number, number],
  );
}

/** @deprecated Use {@link applyCoordFit}. */
export function applyCoordShift(
  coords: ReadonlyArray<readonly [number, number]>,
  fit: CoordFit | null | undefined,
): [number, number][] {
  return applyCoordFit(coords, fit);
}
