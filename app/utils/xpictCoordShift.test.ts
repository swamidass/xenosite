import { describe, expect, it } from "vitest";
import {
  applyCoordFit,
  fitAxis,
  identityCoordFit,
  parseShadeCircles,
  shadeCoordFit,
  shadeMatchTargets,
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

describe("parseShadeCircles", () => {
  it("reads class=shade disks", () => {
    expect(parseShadeCircles(SVG)).toEqual([
      { x: 20, y: 77.63 },
      { x: 54.64, y: 77.67 },
      { x: 37.29, y: 87.65 },
    ]);
  });

  it("returns empty when no shade layer", () => {
    expect(
      parseShadeCircles(`<svg><circle cx="1" cy="2" r="3"/></svg>`),
    ).toEqual([]);
  });
});

describe("fitAxis", () => {
  it("returns identity with no samples", () => {
    expect(fitAxis([], [])).toEqual({ scale: 1, shift: 0 });
  });

  it("uses translation only with one sample", () => {
    expect(fitAxis([10], [13])).toEqual({ scale: 1, shift: 3 });
  });

  it("fits scale+shift with two samples", () => {
    // dst = 2*src + 1
    const { scale, shift } = fitAxis([0, 10], [1, 21]);
    expect(scale).toBeCloseTo(2, 8);
    expect(shift).toBeCloseTo(1, 8);
  });

  it("falls back to translation when src has no spread", () => {
    expect(fitAxis([5, 5], [8, 8])).toEqual({ scale: 1, shift: 3 });
  });
});

describe("shadeMatchTargets", () => {
  it("includes bond midpoints", () => {
    expect(
      shadeMatchTargets(
        [
          [0, 0],
          [20, 0],
        ],
        [[0, 1]],
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 10, y: 0 },
    ]);
  });
});

describe("shadeCoordFit", () => {
  it("returns identity with no shade circles", () => {
    expect(
      shadeCoordFit(`<svg></svg>`, [
        [1, 2],
        [3, 4],
      ]),
    ).toEqual(identityCoordFit());
  });

  it("recovers pure translation (phenol-like label pad)", () => {
    const dy = 7.65;
    const coords: [number, number][] = [
      [20, 77.63 - dy],
      [54.64, 77.67 - dy],
      [37.29, 87.65 - dy],
    ];
    const fit = shadeCoordFit(SVG, coords);
    expect(fit.xscale).toBeCloseTo(1, 5);
    expect(fit.yscale).toBeCloseTo(1, 5);
    expect(fit.xshift).toBeCloseTo(0, 5);
    expect(fit.yshift).toBeCloseTo(dy, 5);
  });

  it("recovers independent x/y scale and shift", () => {
    // Mild scale so nearest-neighbor pairing still finds the right targets
    // (real xpict drift is ~translation; scale is a small correction).
    const coords: [number, number][] = [
      [20, 40],
      [60, 40],
      [40, 80],
    ];
    const mk = (x: number, y: number) => ({
      x: 1.1 * x + 2,
      y: 0.95 * y - 1,
    });
    const shades = coords.map(([x, y]) => mk(x, y));
    const svg = `<svg>${shades
      .map(
        (s) =>
          `<circle cx="${s.x}" cy="${s.y}" r="8" class="shade"/>`,
      )
      .join("")}</svg>`;
    const fit = shadeCoordFit(svg, coords);
    expect(fit.xscale).toBeCloseTo(1.1, 5);
    expect(fit.xshift).toBeCloseTo(2, 5);
    expect(fit.yscale).toBeCloseTo(0.95, 5);
    expect(fit.yshift).toBeCloseTo(-1, 5);
  });

  it("does not invent a half-bond shift from bond_shade midpoints", () => {
    const bondSvg = `<svg><circle cx="10" cy="0" r="8" class="shade"/></svg>`;
    const coords: [number, number][] = [
      [0, 0],
      [20, 0],
    ];
    const broken = shadeCoordFit(bondSvg, coords, null);
    // One shade vs nearest atom → translation ±10, scale 1
    expect(Math.abs(broken.xshift)).toBeCloseTo(10, 5);

    const fixed = shadeCoordFit(bondSvg, coords, [[0, 1]]);
    expect(fixed.xscale).toBeCloseTo(1, 5);
    expect(fixed.yscale).toBeCloseTo(1, 5);
    expect(fixed.xshift).toBeCloseTo(0, 5);
    expect(fixed.yshift).toBeCloseTo(0, 5);
  });

  it("translation-only with a single shade pair", () => {
    const svg = `<svg><circle cx="23" cy="12" r="8" class="shade"/></svg>`;
    const fit = shadeCoordFit(svg, [[20, 10]]);
    expect(fit).toEqual({
      xscale: 1,
      yscale: 1,
      xshift: 3,
      yshift: 2,
    });
  });
});

describe("applyCoordFit", () => {
  it("applies scale and shift", () => {
    expect(
      applyCoordFit(
        [
          [1, 2],
          [3, 4],
        ],
        { xscale: 2, xshift: 1, yscale: 0.5, yshift: 3 },
      ),
    ).toEqual([
      [3, 4],
      [7, 5],
    ]);
  });

  it("copies on identity / null", () => {
    const coords: [number, number][] = [
      [1, 2],
      [3, 4],
    ];
    expect(applyCoordFit(coords, null)).toEqual(coords);
    expect(applyCoordFit(coords, identityCoordFit())).toEqual(coords);
  });
});
