/**
 * Browser-only xpict helpers. Remix empties `*.client.ts` on the server.
 *
 * Coords come from the `Rendered` object — no SVG embed_script.
 * Mol instances are cached so parent `frame_molblock` is shared with
 * metabolite `align_to` at every hop.
 */
import {
  xpict,
  type Mol,
  type MolRenderOptions,
  type Rendered,
} from "@swamidasslab/xpict";
import { starLabelsFromCxsmiles } from "~/utils/cxsmiles";
import { XPICT_SCALE } from "~/utils/xpictShade";

export type XpictPaintOptions = Pick<
  MolRenderOptions,
  | "atom_shade"
  | "bond_shade"
  | "mark_atoms"
  | "mark_bonds"
  | "color"
  | "bold_labels"
  | "star_labels"
  | "align_to"
> & {
  /** Convenience: parent SMILES → cached `Mol` for `align_to`. */
  alignToSmiles?: string | null;
};

export type XpictPaintResult = {
  svg: string;
  /** Atom centers in viewBox space, index-aligned. */
  coords: [number, number][];
  bondsIdx: [number, number][];
  width: number;
  height: number;
  scale: number;
  rendered: Rendered;
};

const molCache = new Map<string, Mol>();

/** Stable `xpict.mol` per SMILES so `frame_molblock` survives across paints. */
export function molCached(smiles: string): Mol {
  const key = smiles.trim();
  let m = molCache.get(key);
  if (!m) {
    m = xpict.mol(key);
    molCache.set(key, m);
  }
  return m;
}

let wasmReady: Promise<void> | null = null;

/** Prefetch RDKit + wasm using a stable public wasm URL (Remix-safe). */
async function ensureXpictReady(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const { initNative } = await import(
        "@swamidasslab/xpict/dist/native.js"
      );
      const wasmUrl = new URL(
        "/xpict/xpict_core_bg.wasm",
        window.location.origin,
      );
      await initNative({ module_or_path: wasmUrl });
    })().catch((err) => {
      wasmReady = null;
      throw err;
    });
  }
  await wasmReady;
}

export function coordsFromRendered(rendered: Rendered): [number, number][] {
  let max = -1;
  for (const a of rendered.svg_coords) {
    if (a.index > max) max = a.index;
  }
  const out: [number, number][] = Array.from({ length: max + 1 }, () => [0, 0]);
  for (const a of rendered.svg_coords) {
    out[a.index] = [a.x, a.y];
  }
  return out;
}

export function bondsFromRendered(rendered: Rendered): [number, number][] {
  return [...rendered.bonds]
    .sort((a, b) => a.index - b.index)
    .map((b) => [b.begin, b.end]);
}

export async function paintSmiles(
  smiles: string,
  options: XpictPaintOptions = {},
): Promise<XpictPaintResult> {
  const source = smiles.trim();
  if (!source) throw new Error("paintSmiles requires a non-empty SMILES");

  await ensureXpictReady();

  const { alignToSmiles, align_to, star_labels, ...rest } = options;
  const alignTarget =
    align_to ??
    (alignToSmiles && alignToSmiles.trim()
      ? molCached(alignToSmiles)
      : undefined);

  // JS xpict does not auto-apply CXSMILES aliases — derive star_labels here.
  const cxStars = star_labels ?? starLabelsFromCxsmiles(source);

  const rendered = await xpict.render(molCached(source), {
    ...rest,
    ...(alignTarget ? { align_to: alignTarget } : {}),
    ...(cxStars ? { star_labels: cxStars } : {}),
  });
  const svg = xpict.toSvg(rendered.scene);
  return {
    svg,
    coords: coordsFromRendered(rendered),
    bondsIdx: bondsFromRendered(rendered),
    width: rendered.width,
    height: rendered.height,
    scale: XPICT_SCALE,
    rendered,
  };
}
