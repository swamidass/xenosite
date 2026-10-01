/** Shared xpict helpers safe for SSR (no wasm / RDKit). */

/** Mean bond length in xpict / xenopict SVG space. */
export const XPICT_SCALE = 20;

/** Flatten API score fields (`atom` / `bond`) into a shade vector. */
export function shadeVector(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: number[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
    else if (Array.isArray(v)) for (const x of v) walk(x);
  };
  walk(raw);
  return out.length ? out : undefined;
}

/**
 * Prediction scores are already on [0, 1]. Force xpict's shade window so
 * colors are not rescaled to each molecule's local max.
 */
export function withFixedShadeWindow<
  T extends {
    atom_shade?: number[];
    bond_shade?: number[];
    shade_vmin?: number;
    shade_vmax?: number;
  },
>(opts: T): T {
  const hasShade =
    (opts.atom_shade && opts.atom_shade.length > 0) ||
    (opts.bond_shade && opts.bond_shade.length > 0);
  if (!hasShade) return opts;
  return {
    ...opts,
    shade_vmin: opts.shade_vmin ?? 0,
    shade_vmax: opts.shade_vmax ?? 1,
  };
}
