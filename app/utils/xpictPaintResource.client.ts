/**
 * Suspense cache for browser xpict paints.
 * Remix empties `*.client.ts` on the server — only read this after hydrate
 * (wrap with {@link ClientOnly} + {@link Suspense}).
 */
import {
  paintSmiles,
  type XpictPaintOptions,
  type XpictPaintResult,
} from "~/utils/xpictClient.client";

type Pending = {
  status: "pending";
  promise: Promise<XpictPaintResult>;
};
type Success = { status: "success"; value: XpictPaintResult };
type Failure = { status: "error"; error: Error };
type Entry = Pending | Success | Failure;

const cache = new Map<string, Entry>();

function paintKey(smiles: string, options: XpictPaintOptions): string {
  const {
    alignToSmiles,
    atom_shade,
    bond_shade,
    mark_atoms,
    mark_bonds,
    color,
    weight,
    star_labels,
  } = options;
  return JSON.stringify({
    smiles: smiles.trim(),
    alignToSmiles: alignToSmiles ?? null,
    atom_shade: atom_shade ?? null,
    bond_shade: bond_shade ?? null,
    mark_atoms: mark_atoms ?? null,
    mark_bonds: mark_bonds ?? null,
    color: color ?? null,
    weight: weight ?? null,
    star_labels: star_labels ?? null,
  });
}

/**
 * Suspend until `paintSmiles` resolves for this key.
 * Must run in the browser under a Suspense boundary.
 */
export function readXpictPaint(
  smiles: string,
  options: XpictPaintOptions = {},
): XpictPaintResult {
  const key = paintKey(smiles, options);
  let entry = cache.get(key);
  if (!entry) {
    const promise = paintSmiles(smiles, options).then(
      (value) => {
        cache.set(key, { status: "success", value });
        return value;
      },
      (err: unknown) => {
        const error =
          err instanceof Error ? err : new Error(String(err ?? "xpict failed"));
        cache.set(key, { status: "error", error });
        throw error;
      },
    );
    entry = { status: "pending", promise };
    cache.set(key, entry);
  }
  if (entry.status === "pending") throw entry.promise;
  if (entry.status === "error") throw entry.error;
  return entry.value;
}

/** Drop a cache entry (e.g. after ErrorBoundary retry). */
export function clearXpictPaint(
  smiles: string,
  options: XpictPaintOptions = {},
): void {
  cache.delete(paintKey(smiles, options));
}

/** Clear the whole paint cache (tests). */
export function clearAllXpictPaint(): void {
  cache.clear();
}
