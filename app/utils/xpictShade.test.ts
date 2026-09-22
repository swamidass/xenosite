import { describe, expect, it } from "vitest";
import { shadeVector, XPICT_SCALE } from "./xpictShade";

describe("xpictShade", () => {
  it("exports xenopict scale", () => {
    expect(XPICT_SCALE).toBe(20);
  });

  it("flattens nested score arrays", () => {
    expect(shadeVector([0.1, 0.5, 0.9])).toEqual([0.1, 0.5, 0.9]);
    expect(shadeVector([[0.2], [0.4, 0.6]])).toEqual([0.2, 0.4, 0.6]);
  });

  it("returns undefined for empty / missing", () => {
    expect(shadeVector(undefined)).toBeUndefined();
    expect(shadeVector([])).toBeUndefined();
    expect(shadeVector("x")).toBeUndefined();
  });
});
