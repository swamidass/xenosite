/**
 * Server-only xpict paint (Node / Vercel serverless).
 * Used for Open Graph PNGs — interactive UI paints in the browser instead.
 *
 * Load via dynamic `import()` — the package is ESM-only (`"type":"module"`),
 * so a static `require()` crashes the whole Vercel serverless bundle at boot.
 *
 * Do not import from client modules (pulls RDKit + wasm into the browser bundle).
 */
import type { MolRenderOptions } from "@swamidasslab/xpict";
import { starLabelsFromCxsmiles } from "~/utils/cxsmiles";
import { shadeVector } from "~/utils/xpictShade";

export type XpictServerPaintOptions = Pick<
  MolRenderOptions,
  | "atom_shade"
  | "bond_shade"
  | "mark_atoms"
  | "mark_bonds"
  | "color"
  | "bold_labels"
  | "star_labels"
> & {
  /** Raw API `atom` / `bond` score fields → shade vectors. */
  atomScores?: unknown;
  bondScores?: unknown;
};

/**
 * Paint a SMILES to SVG on the server via `@swamidasslab/xpict`.
 */
export async function paintSmilesServer(
  smiles: string,
  options: XpictServerPaintOptions = {},
): Promise<string> {
  const source = smiles.trim();
  if (!source) throw new Error("paintSmilesServer requires a non-empty SMILES");

  const { xpict } = await import("@swamidasslab/xpict");

  const {
    atomScores,
    bondScores,
    atom_shade,
    bond_shade,
    star_labels,
    ...rest
  } = options;

  const atomShade = atom_shade ?? shadeVector(atomScores);
  const bondShade = bond_shade ?? shadeVector(bondScores);
  // 0.1.3+ auto-applies CX trailers; still pass explicitly for older packs.
  const cxStars = star_labels ?? starLabelsFromCxsmiles(source);

  const rendered = await xpict.render(xpict.mol(source), {
    ...rest,
    ...(atomShade ? { atom_shade: atomShade } : {}),
    ...(bondShade ? { bond_shade: bondShade } : {}),
    ...(cxStars ? { star_labels: cxStars } : {}),
  });
  return xpict.toSvg(rendered.scene);
}
