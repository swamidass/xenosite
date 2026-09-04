import { describe, expect, it } from "vitest";
import {
  moleculeDisplayName,
  moleculePathLabel,
} from "~/utils/moleculeIdentity";

describe("moleculeDisplayName", () => {
  it("capitalizes a common name", () => {
    expect(moleculeDisplayName({ name: "salicylic acid" })).toBe(
      "Salicylic acid",
    );
  });

  it("returns blank when name is missing (never SMILES)", () => {
    expect(moleculeDisplayName(null)).toBe("");
    expect(moleculeDisplayName({})).toBe("");
    expect(moleculeDisplayName({ name: "" })).toBe("");
    expect(moleculeDisplayName({ name: "   " })).toBe("");
  });

  it("accepts a bare string name", () => {
    expect(moleculeDisplayName("aspirin")).toBe("Aspirin");
    expect(moleculeDisplayName("")).toBe("");
  });
});

describe("moleculePathLabel", () => {
  it("uses the display name when present", () => {
    expect(moleculePathLabel({ name: "aspirin" })).toBe("Aspirin");
  });

  it("falls back without using SMILES", () => {
    expect(moleculePathLabel(null)).toBe("Metabolite");
    expect(moleculePathLabel({}, "Hop")).toBe("Hop");
  });
});
