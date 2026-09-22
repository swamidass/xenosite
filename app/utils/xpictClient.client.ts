/**
 * Browser-only xpict helpers. Remix empties `*.client.ts` on the server so
 * depiction never runs in SSR / Vercel serverless (avoids burning bandwidth).
 *
 * Runtime loads `/xpict-pkg/*` as plain ESM (see scripts/copy-xpict-public.js),
 * not via the Remix client bundle — that keeps Node builtins out of esbuild.
 */
import type {
  Mol,
  MolRenderOptions,
  Rendered,
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

type XpictApi = {
  mol: (source: string) => Mol;
  render: (
    input: Mol | string,
    opts?: MolRenderOptions,
  ) => Promise<Rendered>;
  toSvg: (scene: Rendered["scene"]) => string;
};

const molCache = new Map<string, Mol>();
let xpictPromise: Promise<XpictApi> | null = null;

/** Load published ESM from /public (not Remix-bundled). */
async function loadXpict(): Promise<XpictApi> {
  if (!xpictPromise) {
    xpictPromise = (async () => {
      const href = new URL("/xpict-pkg/index.js", window.location.origin).href;
      // Variable URL → bundler must not try to resolve/package this import.
      const mod = (await import(/* webpackIgnore: true */ href)) as {
        xpict: XpictApi;
      };
      if (!mod?.xpict) throw new Error("xpict failed to load from /xpict-pkg/");
      return mod.xpict;
    })().catch((err) => {
      xpictPromise = null;
      throw err;
    });
  }
  return xpictPromise;
}

/** Stable `xpict.mol` per SMILES so `frame_molblock` survives across paints. */
export async function molCached(smiles: string): Promise<Mol> {
  const key = smiles.trim();
  let m = molCache.get(key);
  if (!m) {
    const xpict = await loadXpict();
    m = xpict.mol(key);
    molCache.set(key, m);
  }
  return m;
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

/**
 * Paint a SMILES in the browser via xpict (RDKit script + WASM).
 * Browser-only — throws if called during SSR / on the server.
 */
export async function paintSmiles(
  smiles: string,
  options: XpictPaintOptions = {},
): Promise<XpictPaintResult> {
  if (typeof document === "undefined") {
    throw new Error(
      "paintSmiles is browser-only (skip SSR / serverless depiction)",
    );
  }

  const source = smiles.trim();
  if (!source) throw new Error("paintSmiles requires a non-empty SMILES");

  const xpict = await loadXpict();
  const { alignToSmiles, align_to, star_labels, ...rest } = options;
  const alignTarget =
    align_to ??
    (alignToSmiles && alignToSmiles.trim()
      ? await molCached(alignToSmiles)
      : undefined);

  // Until xpict JS auto-applies CX trailers, derive star_labels here.
  const cxStars = star_labels ?? starLabelsFromCxsmiles(source);

  const rendered = await xpict.render(await molCached(source), {
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
