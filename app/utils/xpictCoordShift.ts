/**
 * Temporary: xpict JS ``svg_coords`` omit Rust heteroatom label padding, so
 * overlays drift (phenol OH). Until xpict frames labels correctly, recover a
 * uniform (dx, dy) from one painted prediction shade circle vs its nearest atom.
 */

import { XPICT_SCALE } from "~/utils/xpictShade";

export type Point = { x: number; y: number };
export type CoordShift = { dx: number; dy: number };

/** Max distance (SVG units) to accept a shade↔atom pairing. */
export const SHADE_MATCH_MAX = XPICT_SCALE * 0.75;

const CX_RE = /\bcx=["']([-\d.eE]+)["']/;
const CY_RE = /\bcy=["']([-\d.eE]+)["']/;

/** First ``class="shade"`` disk in an xpict SVG (translation is uniform). */
export function parseFirstShadeCircle(svg: string): Point | null {
  if (!svg) return null;
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
    return { x, y };
  }
  return null;
}

/**
 * Uniform translation that maps ``coords`` onto painted shade ink.
 * One shade disk is enough — label pad is a single (dx, dy) for the mol.
 */
export function shadeCoordShift(
  svg: string,
  coords: ReadonlyArray<readonly [number, number]>,
  maxDist: number = SHADE_MATCH_MAX,
): CoordShift | null {
  const shade = parseFirstShadeCircle(svg);
  if (!shade || coords.length < 1) return null;

  let bestD = Infinity;
  let best: readonly [number, number] | null = null;
  for (const c of coords) {
    if (!c || c.length < 2) continue;
    const d = Math.hypot(shade.x - c[0], shade.y - c[1]);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  if (!best || bestD > maxDist) return null;
  return { dx: shade.x - best[0], dy: shade.y - best[1] };
}

/** Apply a shift to index-aligned atom coords. */
export function applyCoordShift(
  coords: ReadonlyArray<readonly [number, number]>,
  shift: CoordShift | null | undefined,
): [number, number][] {
  if (!shift || (shift.dx === 0 && shift.dy === 0)) {
    return coords.map((c) => [c[0], c[1]] as [number, number]);
  }
  return coords.map(
    (c) => [c[0] + shift.dx, c[1] + shift.dy] as [number, number],
  );
}
