import { describe, expect, it } from "vitest";
import { somFromMetabolite } from "~/components/MoleculeFocus";

describe("somFromMetabolite", () => {
  it("maps a two-atom site to a bond highlight when possible", () => {
    const h = somFromMetabolite(
      { smiles: "X", atom: [0, 1], score: 0.5 },
      [
        [0, 1],
        [1, 2],
      ],
    );
    expect(h).toEqual({ atomIdxs: [0, 1], bondIdx: 0 });
  });

  it("falls back to atom marks", () => {
    const h = somFromMetabolite(
      { smiles: "X", atom: [2], score: 0.5 },
      [[0, 1]],
    );
    expect(h).toEqual({ atomIdxs: [2] });
  });

  it("returns null without atoms", () => {
    expect(somFromMetabolite({ smiles: "X", score: 0.1 }, [])).toBeNull();
  });
});
