import { describe, expect, it } from "vitest";
import {
  hitTestAtom,
  hitTestBond,
  resolveHit,
  selectionModeFromResult,
} from "./siteHitTest";

const coords: [number, number][] = [
  [0, 0],
  [20, 0],
  [20, 20],
];
const bonds: [number, number][] = [
  [0, 1],
  [1, 2],
];

describe("hitTestAtom", () => {
  it("hits nearest atom within radius", () => {
    expect(hitTestAtom(1, 1, coords, 20)).toBe(0);
    expect(hitTestAtom(19, 1, coords, 20)).toBe(1);
  });

  it("returns null when far from all atoms", () => {
    expect(hitTestAtom(100, 100, coords, 20)).toBeNull();
  });
});

describe("hitTestBond", () => {
  it("hits a bond near the segment midpoint", () => {
    expect(hitTestBond(10, 1, coords, bonds, 20)).toBe(0);
  });

  it("returns null away from bonds", () => {
    expect(hitTestBond(100, 100, coords, bonds, 20)).toBeNull();
  });
});

describe("resolveHit", () => {
  it("prefers atoms in atom mode", () => {
    const hit = resolveHit(1, 0, {
      coords,
      bondsIdx: bonds,
      scale: 20,
      mode: "atom",
    });
    expect(hit).toEqual({ kind: "atom", atomIdxs: [0] });
  });

  it("ignores atoms in bond-only mode and hits bonds", () => {
    const hit = resolveHit(10, 0, {
      coords,
      bondsIdx: bonds,
      scale: 20,
      mode: "bond",
    });
    expect(hit?.kind).toBe("bond");
    expect(hit?.bondIdx).toBe(0);
  });
});

describe("selectionModeFromResult", () => {
  it("detects pair, bond, atom, and atom+bond", () => {
    expect(selectionModeFromResult({ pair_idx: [[0, 1]] })).toBe("pair");
    expect(selectionModeFromResult({ bond: [0.1] })).toBe("bond");
    expect(selectionModeFromResult({ atom: [0.1] })).toBe("atom");
    expect(selectionModeFromResult({ atom: [0.1], bond: [0.2] })).toBe(
      "atom+bond",
    );
  });
});
