import { describe, expect, it } from "vitest";
import {
  cxAtomLabels,
  smilesStarAtomIndices,
  starLabelsFromCxsmiles,
} from "./cxsmiles";

describe("cxAtomLabels", () => {
  it("parses ChemAxon atom aliases (xpict parity)", () => {
    const labs = cxAtomLabels("*C1ccccc1 |$R1;;;;;$|");
    expect(labs[0]).toBe("R1");
    expect(labs[1]).toBeNull();
    // Block length is whatever the trailer lists (not padded to atom count).
    expect(labs.length).toBe(5);
  });

  it("strips leading underscore and returns [] without a block", () => {
    expect(cxAtomLabels("*C |$_R;$|")).toEqual(["R"]);
    expect(cxAtomLabels("*C")).toEqual([]);
  });
});

describe("smilesStarAtomIndices", () => {
  it("finds bare and bracket stars in SMILES order", () => {
    expect(smilesStarAtomIndices("*C1ccccc1 |$R1;;;;;$|")).toEqual([0]);
    expect(smilesStarAtomIndices("CC(*)C")).toEqual([2]);
    expect(smilesStarAtomIndices("*C*")).toEqual([0, 2]);
    expect(smilesStarAtomIndices("CCO")).toEqual([]);
  });
});

describe("starLabelsFromCxsmiles", () => {
  it("maps CX slots onto xpict star_labels encounter order", () => {
    expect(starLabelsFromCxsmiles("*C1C=C(O)C=CC1=O |$GSH;;;;;;;;$|")).toEqual([
      "GSH",
    ]);
    expect(starLabelsFromCxsmiles("*C |$R1;$|")).toEqual(["R1"]);
    expect(starLabelsFromCxsmiles("*C* |$A;;B$|")).toEqual(["A", "B"]);
  });

  it("returns undefined without a CX block", () => {
    expect(starLabelsFromCxsmiles("*C")).toBeUndefined();
    expect(starLabelsFromCxsmiles("CCO")).toBeUndefined();
  });
});
