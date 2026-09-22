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
