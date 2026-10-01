import { describe, expect, it } from "vitest";
import {
  createPredictionCache,
  predictionCacheKey,
} from "~/utils/predictionCache";

describe("predictionCache", () => {
  it("keys by model, query, and depict flag", () => {
    expect(predictionCacheKey("phase1", "aspirin", false)).toBe(
      predictionCacheKey("phase1", "aspirin"),
    );
    expect(predictionCacheKey("phase1", "aspirin", false)).not.toBe(
      predictionCacheKey("phase1", "aspirin", true),
    );
    expect(predictionCacheKey("phase1", "aspirin")).not.toBe(
      predictionCacheKey("ugt", "aspirin"),
    );
  });

  it("returns cached values and evicts oldest when full", () => {
    const cache = createPredictionCache({ ttlMs: 60_000, maxEntries: 2 });
    cache.set("a", { ok: 1 });
    expect(cache.get("a")).toEqual({ ok: 1 });
    cache.set("b", 2);
    cache.set("c", 3); // evicts oldest
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe(2);
    expect(cache.size()).toBe(2);
  });
});
