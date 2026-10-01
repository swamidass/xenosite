/**
 * In-memory prediction cache for client loaders and (separately) the server.
 * Keyed by model + smiles (+ depict). TTL keeps memory bounded on long sessions.
 */

export type PredictionCacheEntry = {
  data: unknown;
  at: number;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 200;

export function predictionCacheKey(
  model: string,
  query: string,
  depict = false,
): string {
  return `${model}\0${query}\0${depict ? "1" : "0"}`;
}

export function createPredictionCache(opts?: {
  ttlMs?: number;
  maxEntries?: number;
}) {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const maxEntries = opts?.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const map = new Map<string, PredictionCacheEntry>();

  function get(key: string): unknown | null {
    const hit = map.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > ttlMs) {
      map.delete(key);
      return null;
    }
    // Refresh insertion order for simple LRU-ish eviction.
    map.delete(key);
    map.set(key, hit);
    return hit.data;
  }

  function set(key: string, data: unknown): void {
    if (map.has(key)) map.delete(key);
    map.set(key, { data, at: Date.now() });
    while (map.size > maxEntries) {
      const oldest = map.keys().next().value;
      if (oldest == null) break;
      map.delete(oldest);
    }
  }

  function clear(): void {
    map.clear();
  }

  function size(): number {
    return map.size;
  }

  return { get, set, clear, size };
}

/** Browser / shared module cache for clientLoader. */
export const clientPredictionCache = createPredictionCache();
