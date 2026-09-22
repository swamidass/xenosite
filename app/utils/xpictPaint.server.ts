/**
 * Server-only xpict paint (Node / Vercel serverless).
 * Used for Open Graph PNGs — interactive UI paints in the browser instead.
 *
 * Do not import from client modules (pulls RDKit + wasm into the browser bundle).
 */
import { xpict, type MolRenderOptions } from "@swamidasslab/xpict";
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
  const cxStars = star_labels ?? starLabelsFromCxsmiles(source);

  const rendered = await xpict.render(xpict.mol(source), {
    ...rest,
    ...(atomShade ? { atom_shade: atomShade } : {}),
    ...(bondShade ? { bond_shade: bondShade } : {}),
    ...(cxStars ? { star_labels: cxStars } : {}),
  });
  return xpict.toSvg(rendered.scene);
}
