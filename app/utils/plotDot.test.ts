import { describe, expect, it } from "vitest";
import {
  plotDotCircles,
  plotDotColor,
  plotDotRadius,
  singlePlotDot,
  sortPlotDotLayers,
  xenositeColor,
} from "./plotDot";

describe("plotDot (xenopict PlotDot port)", () => {
  const stops = [0.25, 0.5, 0.75, 1];

  it("matches xenopict radii for level 0", () => {
    expect(plotDotRadius(0.5, 0, stops)).toBeCloseTo(0.5, 10);
    expect(plotDotRadius(1, 0, stops)).toBeCloseTo(0.5, 10);
  });

  it("matches xenopict single_dot layers for z=1", () => {
    const layers = singlePlotDot(1, { levels: 4 });
    expect(layers).toHaveLength(4);
    expect(layers[0].radius).toBeCloseTo(0.5);
    expect(layers[0].color).toBe(1);
    expect(layers[1].radius).toBeCloseTo(Math.SQRT1_2);
    expect(layers[1].color).toBe(0.75);
    expect(layers[2].radius).toBeCloseTo(Math.sqrt(0.75));
    expect(layers[2].color).toBe(0.5);
    expect(layers[3].radius).toBeCloseTo(1);
    expect(layers[3].color).toBe(0.25);
  });

  it("matches xenopict single_dot for z=0.5", () => {
    const layers = singlePlotDot(0.5, { levels: 4 });
    expect(layers).toHaveLength(3);
    expect(layers[0].radius).toBeCloseTo(0.5);
    expect(layers[0].color).toBe(0.5);
  });

  it("omits empty outer rings for small z", () => {
    expect(singlePlotDot(0.1, { levels: 4 })).toEqual([{ radius: 0.5, color: 0.1 }]);
    expect(singlePlotDot(0, { levels: 4 })).toEqual([{ radius: 0.5, color: 0 }]);
  });

  it("preserves sign in color for negative z", () => {
    expect(plotDotColor(-0.5, 0, stops)).toBe(-0.5);
    expect(plotDotColor(-0.5, 2, stops)).toBe(-0.5);
  });

  it("sorts low |color| then small radius first", () => {
    const sorted = sortPlotDotLayers(singlePlotDot(1, { levels: 4 }));
    expect(sorted.map((d) => d.color)).toEqual([0.25, 0.5, 0.75, 1]);
  });

  it("maps through xenosite colormap to rgb fills", () => {
    expect(xenositeColor(0)).toBe("rgb(255,255,255)");
    const circles = plotDotCircles(1, { levels: 4 });
    expect(circles).toHaveLength(4);
    expect(circles[0].fill).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    // Outer ring (drawn first) is cooler / lower cmap value than the center.
    expect(circles[0].color).toBe(0.25);
    expect(circles[circles.length - 1].color).toBe(1);
  });
});
