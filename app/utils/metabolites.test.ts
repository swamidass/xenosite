import { describe, expect, it } from "vitest";
import {
  collectMetabolites,
  findMetaboliteBySmiles,
  formatPathwayLabel,
  matchFormationEdge,
  METABOLITE_DISPLAY_CAP,
  rankMetabolites,
  siteAtomsMatch,
  validateChildFormationEdge,
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

describe("rankMetabolites head filter", () => {
  it("filters by headIndex for multi-head models", () => {
    const { shown, totalMatching } = rankMetabolites(
      [
        { smiles: "A", atom: [0], score: 0.9, headIndex: 0 },
        { smiles: "B", atom: [1], score: 0.8, headIndex: 1 },
        { smiles: "C", atom: [2], score: 0.7, headIndex: 0 },
      ],
      { selection: { headIndex: 0 } },
    );
    expect(totalMatching).toBe(2);
    expect(shown.map((m) => m.smiles)).toEqual(["A", "C"]);
  });

  it("combines headIndex with atom selection", () => {
    const { shown } = rankMetabolites(
      [
        { smiles: "A", atom: [0], score: 0.9, headIndex: 0 },
        { smiles: "B", atom: [0], score: 0.8, headIndex: 1 },
      ],
      { selection: { headIndex: 1, atomIdxs: [0] } },
    );
    expect(shown.map((m) => m.smiles)).toEqual(["B"]);
  });
});

describe("formatPathwayLabel", () => {
  it("splits CamelCase into lower-case words", () => {
    expect(formatPathwayLabel("NitrogenOxidation")).toBe("nitrogen oxidation");
    expect(formatPathwayLabel("Hydrolysis")).toBe("hydrolysis");
    expect(formatPathwayLabel("NDealkylation")).toBe("n dealkylation");
  });
});

describe("siteAtomsMatch / CIP equivalence", () => {
  // Phenol Oc1ccccc1 — orthos 2 and 6 share cipRank 4; metas 3 and 5 share 2.
  const phenolCip = [0, 6, 4, 2, 1, 2, 4];

  it("matches exact sites without CIP", () => {
    expect(siteAtomsMatch([1, 2], [1, 2])).toBe(true);
    expect(siteAtomsMatch([1, 2], [1, 6])).toBe(false);
  });

  it("treats same CIP rank atoms as interchangeable", () => {
    expect(siteAtomsMatch([1, 2], [1, 6], phenolCip)).toBe(true);
    expect(siteAtomsMatch([1, 6], [1, 2], phenolCip)).toBe(true);
    expect(siteAtomsMatch([1, 2], [6], phenolCip)).toBe(true);
  });

  it("does not match unrelated pairs even with CIP", () => {
    expect(siteAtomsMatch([1, 2], [2, 6], phenolCip)).toBe(false);
    expect(siteAtomsMatch([1, 4], [1, 6], phenolCip)).toBe(false);
  });
});

describe("rankMetabolites CIP selection", () => {
  const phenolCip = [0, 6, 4, 2, 1, 2, 4];
  const quinoneMets = [
    { smiles: "o12", atom: [1, 2], score: 0.31, pathway: "QuinoneFormation" },
    { smiles: "o14", atom: [1, 4], score: 0.25, pathway: "QuinoneFormation" },
  ];

  it("finds the metabolite when only one equivalent ortho is listed", () => {
    const { shown, totalMatching } = rankMetabolites(quinoneMets, {
      selection: { atomIdxs: [1, 6] },
      cipRank: phenolCip,
    });
    expect(totalMatching).toBe(1);
    expect(shown[0].smiles).toBe("o12");
  });

  it("prefers the exact atom list when duplicate SMILES exist", () => {
    const { shown } = rankMetabolites(
      [
        { smiles: "o12", atom: [1, 2], score: 0.31 },
        { smiles: "o12", atom: [1, 6], score: 0.31 },
      ],
      { selection: { atomIdxs: [1, 6] }, cipRank: phenolCip },
    );
    expect(shown[0].atom).toEqual([1, 6]);
  });
});

describe("validateChildFormationEdge / matchFormationEdge", () => {
  const mets = [
    {
      smiles: "Oc1cccc(O)c1",
      pathway: "Hydroxylation",
      atom: [1, 2],
      score: 0.4,
      headIndex: 0,
    },
    {
      smiles: "Oc1cccc(O)c1",
      pathway: "Other",
      atom: [1, 6],
      score: 0.2,
      headIndex: 0,
    },
  ];
  // CIP: atoms 2 and 6 are equivalent ranks for ortho pair disambiguation tests.
  const cip = [0, 1, 2, 3, 4, 5, 2];

  it("matches smiles+head+site with CIP equivalence", () => {
    expect(
      matchFormationEdge(
        mets,
        { smiles: "Oc1cccc(O)c1", headIndex: 0, atomIdxs: [1, 6] },
        cip,
      )?.pathway,
    ).toBe("Hydroxylation"); // both sites CIP-match [1,2] and [1,6]; highest score wins
  });

  it("matchIndex picks among CIP-equivalent hits", () => {
    expect(
      matchFormationEdge(
        mets,
        {
          smiles: "Oc1cccc(O)c1",
          headIndex: 0,
          atomIdxs: [1, 6],
          matchIndex: 1,
        },
        cip,
      )?.pathway,
    ).toBe("Other");
  });

  it("fails validation when smiles/head/site do not match", () => {
    expect(
      validateChildFormationEdge(mets, { smiles: "missing" }).ok,
    ).toBe(false);
    expect(
      validateChildFormationEdge(
        mets,
        { smiles: "Oc1cccc(O)c1", headIndex: 9 },
        cip,
      ).ok,
    ).toBe(false);
    expect(
      validateChildFormationEdge(
        mets,
        { smiles: "Oc1cccc(O)c1", headIndex: 0, atomIdxs: [1, 2] },
        cip,
      ).ok,
    ).toBe(true);
  });
});
