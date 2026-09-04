import { describe, expect, it } from "vitest";
import {
  applyPairAtomClick,
  effectiveMetabolitePanelSelection,
  metaboliteSelectUrl,
  somSelectUrl,
  toggleSomHighlight,
} from "~/utils/somInteraction";

describe("effectiveMetabolitePanelSelection", () => {
  const committed = { atomIdxs: [1, 3], bondIdx: 2 };
  const hover = { atomIdxs: [0], bondIdx: null };

  it("uses hover to preview when no downstream metabolite", () => {
    expect(
      effectiveMetabolitePanelSelection({
        childQuery: null,
        committed,
        hover,
      }),
    ).toEqual(hover);
  });

  it("ignores hover when a downstream metabolite is selected", () => {
    expect(
      effectiveMetabolitePanelSelection({
        childQuery: "O=C(O)c1ccccc1O",
        committed: { metaboliteSmiles: "O=C(O)c1ccccc1O" },
        hover,
      }),
    ).toEqual({ metaboliteSmiles: "O=C(O)c1ccccc1O" });
  });

  it("falls back to committed when not hovering", () => {
    expect(
      effectiveMetabolitePanelSelection({
        childQuery: null,
        committed,
        hover: null,
      }),
    ).toEqual(committed);
  });
});

describe("toggleSomHighlight", () => {
  it("clears when clicking the same site again", () => {
    const cur = { atomIdxs: [1, 3], bondIdx: 2 };
    expect(toggleSomHighlight(cur, { ...cur })).toBeNull();
  });

  it("replaces when clicking a different site", () => {
    const cur = { atomIdxs: [1], bondIdx: null };
    const next = { atomIdxs: [2], bondIdx: null };
    expect(toggleSomHighlight(cur, next)).toEqual(next);
  });
});

describe("metaboliteSelectUrl", () => {
  const generations = [
    { model: "phase1", query: "aspirin" },
    { model: "phase1", query: "O=C(O)c1ccccc1O" },
  ];

  it("appends a new metabolite hop", () => {
    expect(
      metaboliteSelectUrl({
        generations: generations.slice(0, 1),
        depth: 0,
        metaboliteSmiles: "O=C(O)c1ccccc1O",
        childQuery: null,
      }),
    ).toBe("/phase1/aspirin/m/phase1/O%3DC(O)c1ccccc1O");
  });

  it("unselects by clicking the selected metabolite again", () => {
    expect(
      metaboliteSelectUrl({
        generations: generations.slice(0, 1),
        depth: 0,
        metaboliteSmiles: "O=C(O)c1ccccc1O",
        childQuery: "O=C(O)c1ccccc1O",
      }),
    ).toBe("/phase1/aspirin");
  });
});

describe("somSelectUrl", () => {
  const generations = [
    { model: "phase1", query: "aspirin" },
    { model: "phase1", query: "O=C(O)c1ccccc1O" },
  ];

  it("pops the metabolite hop and applies SOM params", () => {
    expect(
      somSelectUrl({
        generations,
        depth: 0,
        atomIdxs: [1, 3],
        bondIdx: 2,
        head: "hydrolysis",
      }),
    ).toBe("/phase1/aspirin?atom=1&atom=3&bond=2&head=hydrolysis");
  });
});

describe("applyPairAtomClick", () => {
  it("builds a two-atom selection across clicks", () => {
    const first = applyPairAtomClick(null, {
      kind: "atom",
      atomIdxs: [2],
    });
    expect(first).toEqual({ atomIdxs: [2] });
    const second = applyPairAtomClick(first, {
      kind: "atom",
      atomIdxs: [0],
    });
    expect(second).toEqual({ atomIdxs: [0, 2] });
  });

  it("toggles an atom off and starts over after two", () => {
    const pair = { atomIdxs: [0, 2] };
    expect(
      applyPairAtomClick(pair, { kind: "atom", atomIdxs: [0] }),
    ).toEqual({ atomIdxs: [2] });
    expect(
      applyPairAtomClick(pair, { kind: "atom", atomIdxs: [5] }),
    ).toEqual({ atomIdxs: [5] });
  });
});
