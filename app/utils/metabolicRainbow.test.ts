import { describe, expect, it } from "vitest";
import { backboneColorForModel } from "./metabolicRainbow";

describe("backboneColorForModel", () => {
  it("maps Phase I heads to Metabolic Rainbow hex (API parity)", () => {
    expect(backboneColorForModel("phase1.stable_oxygenation")).toBe("#D55E00");
    expect(backboneColorForModel("phase1.unstable_oxygenation")).toBe("#E69F00");
    expect(backboneColorForModel("phase1.dehydrogenation")).toBe("#009E73");
    expect(backboneColorForModel("phase1.hydrolysis")).toBe("#56B4E9");
    expect(backboneColorForModel("phase1.reduction")).toBe("#CC79A7");
  });

  it("returns undefined for non-Phase-I models", () => {
    expect(backboneColorForModel("epoxidation")).toBeUndefined();
    expect(backboneColorForModel("ugt")).toBeUndefined();
    expect(backboneColorForModel(undefined)).toBeUndefined();
  });
});
