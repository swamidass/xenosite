import { describe, expect, it } from "vitest";
import {
  applyCoordShift,
  parseFirstShadeCircle,
  shadeCoordShift,
} from "~/utils/xpictCoordShift";

const SVG = `
<svg viewBox="0 0 80 110">
  <g class="xpict-layer xpict-shading">
    <circle cx="20" cy="77.63" r="8" fill="rgb(181,208,255)" class="shade"/>
    <circle cx="54.64" cy="77.67" r="8" fill="rgb(181,208,255)" class="shade"/>
    <circle cx="37.29" cy="87.65" r="8" fill="rgb(74,133,255)" class="shade"/>
  </g>
  <circle cx="10" cy="10" r="2" fill="#000"/>
</svg>`;

describe("parseFirstShadeCircle", () => {
  it("reads the first class=shade disk only", () => {
    expect(parseFirstShadeCircle(SVG)).toEqual({ x: 20, y: 77.63 });
  });

  it("returns null when no shade layer", () => {
    expect(
      parseFirstShadeCircle(`<svg><circle cx="1" cy="2" r="3"/></svg>`),
    ).toBeNull();
  });
});

describe("shadeCoordShift", () => {
  it("recovers offset from a single shade↔atom pair", () => {
    const dy = 7.65;
    const coords: [number, number][] = [
      [20, 77.63 - dy],
      [54.64, 77.67 - dy],
      [10, 40],
    ];
    const shift = shadeCoordShift(SVG, coords);
    expect(shift).not.toBeNull();
    expect(shift!.dx).toBeCloseTo(0, 5);
    expect(shift!.dy).toBeCloseTo(dy, 5);
  });

  it("recovers both dx and dy", () => {
    const coords: [number, number][] = [
      [20 - 3, 77.63 - 5],
      [54.64 - 3, 77.67 - 5],
    ];
    const shift = shadeCoordShift(SVG, coords);
    expect(shift).not.toBeNull();
    expect(shift!.dx).toBeCloseTo(3, 5);
    expect(shift!.dy).toBeCloseTo(5, 5);
  });

  it("returns null without shade circles", () => {
    expect(
      shadeCoordShift(`<svg></svg>`, [
        [1, 2],
        [3, 4],
      ]),
    ).toBeNull();
  });
});

describe("applyCoordShift", () => {
  it("translates coords or copies when shift is null", () => {
    const coords: [number, number][] = [
      [1, 2],
      [3, 4],
    ];
    expect(applyCoordShift(coords, { dx: 1, dy: -2 })).toEqual([
      [2, 0],
      [4, 2],
    ]);
    expect(applyCoordShift(coords, null)).toEqual(coords);
  });
});
