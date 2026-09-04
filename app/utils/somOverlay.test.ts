import { describe, expect, it } from "vitest";
import {
  buildOverlayMarks,
  normalizeBondsIdx,
  somAtomRadius,
  somStrokeWidths,
} from "./somOverlay";

describe("somStrokeWidths", () => {
  it("scales stroke with depiction scale", () => {
    const { black, white } = somStrokeWidths(20);
    expect(black).toBeCloseTo(5.2);
    expect(white).toBeCloseTo(3.2);
  });
});

describe("somAtomRadius", () => {
  it("scales with depiction scale", () => {
    expect(somAtomRadius(20)).toBe(10);
  });
});

describe("normalizeBondsIdx", () => {
  it("keeps valid pairs and drops junk", () => {
    expect(normalizeBondsIdx([[0, 1], [2], "x", [3, 4, 5]])).toEqual([
      [0, 1],
      [3, 4],
    ]);
  });
});

describe("buildOverlayMarks", () => {
  const coords: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
  ];
  const bonds: [number, number][] = [
    [0, 1],
    [1, 2],
  ];

  it("returns atom marks for atom highlights", () => {
    expect(
      buildOverlayMarks({ atomIdxs: [0, 2] }, coords, bonds),
    ).toEqual([
      { kind: "atom", x: 0, y: 0 },
      { kind: "atom", x: 10, y: 10 },
    ]);
  });

  it("places a circle at the bond midpoint when bondIdx is set", () => {
    expect(
      buildOverlayMarks({ atomIdxs: [0, 1], bondIdx: 0 }, coords, bonds),
    ).toEqual([{ kind: "bond", x: 5, y: 0 }]);
  });

  it("returns empty when highlight missing", () => {
    expect(buildOverlayMarks(null, coords, bonds)).toEqual([]);
  });
});
