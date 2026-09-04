import { describe, expect, it } from "vitest";
import { ALL_MODELS, MODELS, resolveModelInfo } from "~/data";

describe("resolveModelInfo", () => {
  it("returns undefined without a path", () => {
    expect(resolveModelInfo()).toBeUndefined();
    expect(resolveModelInfo(null)).toBeUndefined();
  });

  it("maps _ to All Models", () => {
    expect(resolveModelInfo("_")).toEqual(ALL_MODELS);
    expect(ALL_MODELS.info()).toBeTruthy();
  });

  it("resolves every catalogued model and its info panel", () => {
    for (const m of MODELS) {
      expect(resolveModelInfo(m.path)?.path).toBe(m.path);
      expect(m.info()).toBeTruthy();
    }
  });
});
