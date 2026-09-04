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

/** Unit-disc viewBox side used by PlotDot (radii reach 1; slight pad). */
export const PLOT_DOT_VIEW = 2.05;

export type PlotDotScaleStop = {
  /** Scalar at this tick (high → low, top → bottom). */
  value: number;
  /** Label drawn on the disc; unlabeled ticks get a ruler mark. */
  label: string | null;
};

export type PlotDotScaleStopOptions = {
  /**
   * Nine ticks at 1/8 (xenopict `scale.extra.xml`); default five ticks at
   * 1/4 (`scale.xml`: shade 1:0 3:.25 5:.5 7:.75 9:1).
   */
  dense?: boolean;
  /** Range [-1, 1] instead of [0, 1]. */
  diverging?: boolean;
};

/** Format matching xenopict scale.xml (`1.0`, `0.5`, `0.0`, `-1.0`). */
export function formatPlotDotScaleLabel(z: number): string {
  return z.toFixed(1);
}

/**
 * Vertical scale-bar ticks, xenopict `scale_bar` / `scale.xml`.
 * High values at the top; labels on first, middle, and last discs.
 */
export function plotDotScaleStops(
  options: PlotDotScaleStopOptions = {},
): PlotDotScaleStop[] {
  const diverging = options.diverging ?? false;
  const n = options.dense ? 9 : 5;
  const max = 1;
  const min = diverging ? -1 : 0;
  const mid = Math.floor((n - 1) / 2);
  return Array.from({ length: n }, (_, i) => {
    const value = max - (i / (n - 1)) * (max - min);
    const labeled = i === 0 || i === n - 1 || i === mid;
    return {
      value,
      label: labeled ? formatPlotDotScaleLabel(value) : null,
    };
  });
}

/**
 * Xenopict `drawer.shade`: plotted radius is `plotdot_r * scale * 0.9`,
 * while adjacent atoms are `scale` apart. scale.xml places 9 carbons at
 * y2 step 0.5, and shades every other atom by default.
 */
export const XENOPICT_PLOT_DOT_BOND_RADIUS = 0.9;
export const PLOT_DOT_SCALE_ATOM_STEP = 0.5;
export const PLOT_DOT_SCALE_ATOM_COUNT = 9;

/** Center-to-center gap in unit-disc space (r_max = 1). */
export function plotDotScaleSpacing(atomStep: number): number {
  return atomStep / XENOPICT_PLOT_DOT_BOND_RADIUS;
}

export type PlotDotScaleAtom = {
  /** Center y in unit-disc space (top → bottom). */
  cy: number;
  value: number | null;
  label: string | null;
};

export type PlotDotScaleCircle = PlotDotCircle & {
  cx: number;
  cy: number;
};

export type PlotDotScaleLayout = {
  cx: number;
  width: number;
  height: number;
  atoms: PlotDotScaleAtom[];
  /** All discs, xenopict painter order (low |color|, then small r). */
  circles: PlotDotScaleCircle[];
};

/**
 * Geometry for the xenopict scale bar: 9 atom slots, overlapping PlotDots,
 * global sort so hotter inner discs paint over cooler neighbors.
 */
export function plotDotScaleLayout(
  options: PlotDotScaleStopOptions & PlotDotOptions = {},
): PlotDotScaleLayout {
  const dense = options.dense ?? false;
  const stops = plotDotScaleStops(options);
  const spacing = plotDotScaleSpacing(PLOT_DOT_SCALE_ATOM_STEP);
  const pad = PLOT_DOT_VIEW / 2;
  const cx = pad;
  const n = PLOT_DOT_SCALE_ATOM_COUNT;
  const height = pad * 2 + (n - 1) * spacing;

  const atoms: PlotDotScaleAtom[] = Array.from({ length: n }, (_, k) => {
    const cy = pad + k * spacing;
    if (dense) {
      const stop = stops[k];
      return { cy, value: stop?.value ?? null, label: stop?.label ?? null };
    }
    // scale.xml: shade atoms 9,7,5,3,1 (every other, top = 1.0).
    if (k % 2 === 1) return { cy, value: null, label: null };
    const stop = stops[k / 2];
    return { cy, value: stop?.value ?? null, label: stop?.label ?? null };
  });

  const unsorted: PlotDotScaleCircle[] = [];
  for (const atom of atoms) {
    if (atom.value == null) continue;
    for (const c of plotDotCircles(atom.value, options)) {
      unsorted.push({ ...c, cx, cy: atom.cy });
    }
  }
  const circles = [...unsorted].sort(
    (a, b) => Math.abs(a.color) - Math.abs(b.color) || a.radius - b.radius,
  );

  return { cx, width: PLOT_DOT_VIEW, height, atoms, circles };
}

const SCALE_TICK_HALF = 0.35;
const SCALE_STROKE = 0.06;

function xmlAttr(n: number): string {
  return String(n);
}

/**
 * Standalone SVG markup (with xmlns) so the scale bar can be used as an
 * `<img src="data:image/svg+xml,...">` and copied via the browser image menu.
 */
export function plotDotScaleBarSvg(
  options: PlotDotScaleStopOptions & PlotDotOptions & { size?: number } = {},
): { svg: string; alt: string; width: number; height: number } {
  const size = options.size ?? 32;
  const layout = plotDotScaleLayout(options);
  const { cx, width, height, atoms, circles } = layout;
  const pxH = (size * height) / width;
  const labeled = atoms.filter((a) => a.label);
  const shaded = atoms.filter((a) => a.value != null);
  const lo = shaded[shaded.length - 1]?.value ?? 0;
  const hi = shaded[0]?.value ?? 1;
  const alt = `Probability scale from ${lo.toFixed(1)} to ${hi.toFixed(1)}`;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${pxH}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`,
  ];
  for (const c of circles) {
    parts.push(
      `<circle cx="${xmlAttr(c.cx)}" cy="${xmlAttr(c.cy)}" r="${xmlAttr(c.radius)}" fill="${c.fill}"/>`,
    );
  }
  for (let k = 0; k < labeled.length - 1; k++) {
    const a = labeled[k];
    const b = labeled[k + 1];
    if (!a || !b) continue;
    parts.push(
      `<line x1="${cx}" y1="${a.cy + 0.35}" x2="${cx}" y2="${b.cy - 0.35}" stroke="#111" stroke-width="${SCALE_STROKE}"/>`,
    );
  }
  for (const atom of atoms) {
    if (atom.value == null || atom.label) continue;
    parts.push(
      `<line x1="${cx - SCALE_TICK_HALF}" y1="${atom.cy}" x2="${cx + SCALE_TICK_HALF}" y2="${atom.cy}" stroke="#111" stroke-width="${SCALE_STROKE}"/>`,
    );
  }
  for (const atom of atoms) {
    if (!atom.label) continue;
    parts.push(
      `<text x="${cx}" y="${atom.cy}" text-anchor="middle" dominant-baseline="central" fill="#111" stroke="#fff" stroke-width="0.18" paint-order="stroke" font-size="0.72" font-weight="600" font-family="system-ui,sans-serif">${atom.label}</text>`,
    );
  }
  parts.push("</svg>");
  return { svg: parts.join(""), alt, width: size, height: pxH };
}
