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

  it("uses hover to filter while a downstream metabolite is selected", () => {
    const site = { atomIdxs: [1, 4], bondIdx: null };
    expect(
      effectiveMetabolitePanelSelection({
        childQuery: "O=C(O)c1ccccc1O",
        committed: { metaboliteSmiles: "O=C(O)c1ccccc1O" },
        hover: site,
      }),
    ).toEqual(site);
  });

  it("shows the full list when a child is selected and nothing is hovered", () => {
    expect(
      effectiveMetabolitePanelSelection({
        childQuery: "O=C(O)c1ccccc1O",
        committed: { metaboliteSmiles: "O=C(O)c1ccccc1O" },
        hover: null,
      }),
    ).toBeNull();
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

  it("appends a metabolite leaf and writes som onto the parent stub", () => {
    expect(
      metaboliteSelectUrl({
        generations: generations.slice(0, 1),
        depth: 0,
        metaboliteSmiles: "O=C(O)c1ccccc1O",
        childQuery: null,
        headIndex: 0,
        site: [1, 2],
      }),
    ).toBe(
      "/phase1/" +
        encodeURIComponent("aspirin;1,2") +
        "/" +
        encodeURIComponent("O=C(O)c1ccccc1O;0"),
    );
  });

  it("replacing a child keeps the nested prediction model", () => {
    expect(
      metaboliteSelectUrl({
        generations,
        depth: 0,
        metaboliteSmiles: "CCO",
        childQuery: "O=C(O)c1ccccc1O",
        headIndex: 1,
        site: [0],
        matchIndex: 1,
      }),
    ).toBe(
      "/phase1/" +
        encodeURIComponent("aspirin;0") +
        "/" +
        encodeURIComponent("CCO;1;1") +
        "/phase1/CCO",
    );
  });

  it("drops following generations but keeps the immediate child's model", () => {
    expect(
      metaboliteSelectUrl({
        generations: [
          { model: "phase1", query: "phenol", som: [1, 2] },
          { model: "ugt", query: "Oc1cccc(O)c1", headIndex: 0 },
          { model: "epoxidation", query: "CCOc1ccccc1", headIndex: 0 },
        ],
        depth: 0,
        metaboliteSmiles: "CCO",
        childQuery: "Oc1cccc(O)c1",
        headIndex: 1,
        site: [3],
      }),
    ).toBe(
      "/phase1/" +
        encodeURIComponent("phenol;3") +
        "/" +
        encodeURIComponent("CCO;1") +
        "/ugt/CCO",
    );
  });

  it("unselects by clicking the selected metabolite again", () => {
    expect(
      metaboliteSelectUrl({
        generations: [
          { model: "phase1", query: "aspirin", som: [1, 2] },
        ],
        depth: 0,
        metaboliteSmiles: "O=C(O)c1ccccc1O",
        childQuery: "O=C(O)c1ccccc1O",
      }),
    ).toBe("/phase1/" + encodeURIComponent("aspirin;1,2"));
  });
});

describe("somSelectUrl", () => {
  const generations = [
    { model: "phase1", query: "aspirin" },
    { model: "phase1", query: "O=C(O)c1ccccc1O" },
  ];

  it("pops the metabolite hop and encodes SOM on the mol stub", () => {
    expect(
      somSelectUrl({
        generations,
        depth: 0,
        atomIdxs: [1, 3],
        bondIdx: 2,
        head: "hydrolysis",
      }),
    ).toBe(
      "/phase1/" +
        encodeURIComponent("aspirin;1,3;b2") +
        "?head=hydrolysis",
    );
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
