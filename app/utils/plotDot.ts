/**
 * Port of xenopict.plotdot.PlotDot — concentric shaded discs for a scalar in [-1, 1].
 * Colors use the xenosite colormap (0…1), matching Xenopict's default cmap.
 */

import xenositeColormap from "~/utils/xenositeColormap.json";

export type PlotDotLayer = {
  /** Radius in unit disc space (0…1+). */
  radius: number;
  /** Colormap coordinate (signed; magnitude used for lookup when diverging). */
  color: number;
};

export type PlotDotCircle = PlotDotLayer & {
  /** CSS fill color after colormap lookup. */
  fill: string;
};

const XENOSITE_STOPS = xenositeColormap as number[][];

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/** Sample the xenosite colormap at t ∈ [0, 1] → `rgb(r,g,b)`. */
export function xenositeColor(t: number): string {
  const stops = XENOSITE_STOPS;
  if (!stops.length) return "rgb(255,255,255)";
  const x = clamp01(t) * (stops.length - 1);
  const i = Math.floor(x);
  const j = Math.min(i + 1, stops.length - 1);
  const f = x - i;
  const a = stops[i];
  const b = stops[j];
  const r = Math.round(((a[0] ?? 1) * (1 - f) + (b[0] ?? 1) * f) * 255);
  const g = Math.round(((a[1] ?? 1) * (1 - f) + (b[1] ?? 1) * f) * 255);
  const bl = Math.round(((a[2] ?? 1) * (1 - f) + (b[2] ?? 1) * f) * 255);
  return `rgb(${r},${g},${bl})`;
}

export type PlotDotOptions = {
  /** Number of concentric levels (xenopict default: 4). */
  levels?: number;
  /**
   * When true, map color ∈ [-1,1] through (c+1)/2 before the colormap
   * (Xenopict `diverging_cmap`). Metabolite scores use false.
   */
  diverging?: boolean;
};

function stopsForLevels(levels: number): number[] {
  const n = Math.max(1, Math.floor(levels));
  return Array.from({ length: n }, (_, i) => (i + 1) / n);
}

export function plotDotRadius(
  z: number,
  level: number,
  stops: number[],
): number {
  const az = Math.abs(z);
  if (level === 0) return Math.sqrt(stops[0] ?? 1);
  const offset = 1 - (stops[level] ?? 1);
  const R = az - offset;
  const minR = stops[0] ?? 0;
  return R < minR ? 0 : Math.sqrt(R);
}

export function plotDotColor(
  z: number,
  level: number,
  stops: number[],
): number {
  const s = z < 0 ? -1 : 1;
  if (level === 0) return z;
  const idx = stops.length - level - 1;
  return s * (stops[idx] ?? 0);
}

/** Layers for one scalar (empty radius filtered out), unsorted. */
export function singlePlotDot(
  z: number,
  options: PlotDotOptions = {},
): PlotDotLayer[] {
  const levels = options.levels ?? 4;
  const stops = stopsForLevels(levels);
  const out: PlotDotLayer[] = [];
  for (let level = 0; level < levels; level++) {
    const radius = plotDotRadius(z, level, stops);
    if (!radius) continue;
    out.push({ radius, color: plotDotColor(z, level, stops) });
  }
  return out;
}

/** Painter order: low |color| then small radius first (drawn underneath). */
export function sortPlotDotLayers(layers: PlotDotLayer[]): PlotDotLayer[] {
  return [...layers].sort(
    (a, b) => Math.abs(a.color) - Math.abs(b.color) || a.radius - b.radius,
  );
}

/**
 * Concentric circles for SVG: radii in unit space, fills from xenosite cmap.
 * `z` is typically a metabolite score in [0, 1].
 */
export function plotDotCircles(
  z: number,
  options: PlotDotOptions = {},
): PlotDotCircle[] {
  const diverging = options.diverging ?? false;
  const layers = sortPlotDotLayers(singlePlotDot(z, options));
  return layers.map((layer) => {
    const t = diverging ? (layer.color + 1) / 2 : Math.abs(layer.color);
    return {
      ...layer,
      fill: xenositeColor(t),
    };
  });
}
