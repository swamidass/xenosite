import { describe, expect, it } from "vitest";
import {
  collectMetabolites,
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
    expect(totalMatching).toBe(7); // all unique smiles ≥ 0.01; A deduped
  });

  it("unselected multi-head merges then sorts by score", () => {
    const { shown, totalMatching } = rankMetabolites([
      { smiles: "H0a", score: 0.4, atom: [0], headIndex: 0 },
      { smiles: "H0b", score: 0.9, atom: [1], headIndex: 0 },
      { smiles: "H1a", score: 0.3, atom: [2], headIndex: 1 },
      { smiles: "H2a", score: 0.2, atom: [3], headIndex: 2 },
      { smiles: "H0c", score: 0.8, atom: [4], headIndex: 0 },
      { smiles: "H1b", score: 0.1, atom: [5], headIndex: 1 },
    ]);
    expect(totalMatching).toBe(6);
    expect(shown.map((m) => m.smiles)).toEqual([
      "H0b",
      "H0c",
      "H0a",
      "H1a",
      "H2a",
    ]);
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

describe("collectMetabolites", () => {
  it("flattens every head and tags headIndex", () => {
    const list = collectMetabolites([
      {
        model: "phase1.stable_oxygenation",
        metabolite: [{ smiles: "A", score: 0.3, atom: [0] }],
      },
      {
        model: "phase1.hydrolysis",
        metabolite: [
          { smiles: "B", score: 0.9, atom: [1] },
          { smiles: "C", score: 0.1, atom: [2] },
        ],
      },
    ]);
    expect(list).toHaveLength(3);
    expect(list.map((m) => m.headIndex)).toEqual([0, 1, 1]);
    expect(list[1].headModel).toBe("phase1.hydrolysis");
  });
});
