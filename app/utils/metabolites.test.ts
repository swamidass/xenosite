import { describe, expect, it } from "vitest";
import {
  findMetaboliteBySmiles,
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
} from "./metabolites";

const sample = [
  { smiles: "A", atom: [0], score: 0.9, pathway: "ox" },
  { smiles: "B", atom: [1], score: 0.5, pathway: "ox" },
  { smiles: "C", atom: [0, 1], score: 0.25, pathway: "ox" },
  { smiles: "D", atom: [2], score: 0.15, pathway: "ox" },
  { smiles: "E", atom: [0], score: 0.8, pathway: "red" },
  { smiles: "F", atom: [3], score: 0.7, pathway: "ox" },
  { smiles: "G", atom: [4], score: 0.6, pathway: "ox" },
  { smiles: "A", atom: [0], score: 0.99, pathway: "dup" }, // dup smiles
];

describe("rankMetabolites", () => {
  it("returns top 5 above threshold when unselected", () => {
    const { shown, totalMatching } = rankMetabolites(sample);
    expect(shown).toHaveLength(5);
    expect(shown.map((m) => m.smiles)).toEqual(["A", "E", "F", "G", "B"]);
    expect(totalMatching).toBe(6); // D below 0.2; A deduped
  });

  it("never exceeds display cap", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      smiles: `S${i}`,
      atom: [i],
      score: 0.9 - i * 0.01,
    }));
    const { shown } = rankMetabolites(many);
    expect(shown.length).toBeLessThanOrEqual(METABOLITE_DISPLAY_CAP);
  });

  it("filters by selected atoms and keeps cap", () => {
    const { shown, totalMatching } = rankMetabolites(sample, {
      selection: { atomIdxs: [0] },
    });
    expect(shown.every((m) => (m.atom || []).includes(0))).toBe(true);
    expect(totalMatching).toBe(3); // A, C, E above threshold with atom 0
    expect(shown[0].smiles).toBe("A");
  });

  it("drops threshold when site filter would otherwise be empty", () => {
    const { shown, totalMatching } = rankMetabolites(sample, {
      selection: { atomIdxs: [2] },
    });
    expect(totalMatching).toBe(1);
    expect(shown[0].smiles).toBe("D");
  });

  it("dedupes by SMILES keeping the highest score", () => {
    const { shown, totalMatching } = rankMetabolites([
      { smiles: "SAL", atom: [0], score: 0.05 },
      { smiles: "SAL", atom: [1, 3], score: 0.89 },
      { smiles: "OTHER", atom: [2], score: 0.3 },
    ]);
    expect(totalMatching).toBe(2);
    expect(shown.map((m) => m.smiles)).toEqual(["SAL", "OTHER"]);
    expect(shown[0].score).toBe(0.89);
    expect(shown[0].atom).toEqual([1, 3]);
  });
});

describe("findMetaboliteBySmiles", () => {
  it("returns the highest-scoring match", () => {
    const m = findMetaboliteBySmiles(
      [
        { smiles: "CCO", atom: [0], score: 0.1 },
        { smiles: "CCO", atom: [1], score: 0.8 },
        { smiles: "CCC", atom: [2], score: 0.9 },
      ],
      "CCO",
    );
    expect(m?.score).toBe(0.8);
    expect(m?.atom).toEqual([1]);
  });

  it("returns null when missing", () => {
    expect(findMetaboliteBySmiles([{ smiles: "CCO", score: 1 }], "O")).toBeNull();
  });
});
