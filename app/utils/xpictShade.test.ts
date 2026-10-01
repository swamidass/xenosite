import { describe, expect, it } from "vitest";
import {
  shadeVector,
  withFixedShadeWindow,
  XPICT_SCALE,
} from "./xpictShade";

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

  it("pins shade window to [0, 1] when shades are present", () => {
    expect(
      withFixedShadeWindow({ atom_shade: [0.2, 0.5] }),
    ).toMatchObject({ shade_vmin: 0, shade_vmax: 1 });
    expect(withFixedShadeWindow({ color: "#000" })).toEqual({ color: "#000" });
    expect(
      withFixedShadeWindow({
        bond_shade: [0.3],
        shade_vmax: 0.8,
      }),
    ).toMatchObject({ shade_vmin: 0, shade_vmax: 0.8 });
  });
});
