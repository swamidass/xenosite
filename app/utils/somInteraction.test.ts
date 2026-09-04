import { describe, expect, it } from "vitest";
import {
  effectiveMetabolitePanelSelection,
  metaboliteSelectUrl,
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
