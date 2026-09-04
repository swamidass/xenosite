import { describe, expect, it } from "vitest";
import {
  plotDotCircles,
  plotDotColor,
  plotDotRadius,
  plotDotScaleBarSvg,
  plotDotScaleLayout,
  plotDotScaleSpacing,
  plotDotScaleStops,
  PLOT_DOT_SCALE_ATOM_STEP,
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

describe("plotDotScaleStops (xenopict scale.xml)", () => {
  it("matches scale.xml: 1, .75, .5, .25, 0 with labels at 1.0 / 0.5 / 0.0", () => {
    const stops = plotDotScaleStops();
    expect(stops.map((s) => s.value)).toEqual([1, 0.75, 0.5, 0.25, 0]);
    expect(stops.map((s) => s.label)).toEqual(["1.0", null, "0.5", null, "0.0"]);
  });

  it("matches scale.extra.xml spacing when dense", () => {
    const stops = plotDotScaleStops({ dense: true });
    expect(stops).toHaveLength(9);
    expect(stops[0]).toEqual({ value: 1, label: "1.0" });
    expect(stops[4]).toEqual({ value: 0.5, label: "0.5" });
    expect(stops[8]).toEqual({ value: 0, label: "0.0" });
    expect(stops[1]?.value).toBeCloseTo(0.875);
    expect(stops[1]?.label).toBeNull();
  });

  it("uses [-1, 1] with end/mid labels when diverging", () => {
    const stops = plotDotScaleStops({ diverging: true });
    expect(stops.map((s) => s.value)).toEqual([1, 0.5, 0, -0.5, -1]);
    expect(stops.map((s) => s.label)).toEqual([
      "1.0",
      null,
      "0.0",
      null,
      "-1.0",
    ]);
  });
});

describe("plotDotScaleLayout (xenopict overlap)", () => {
  it("packs 9 atoms at y2 step 0.5 so adjacent discs overlap", () => {
    const spacing = plotDotScaleSpacing(PLOT_DOT_SCALE_ATOM_STEP);
    expect(spacing).toBeCloseTo(0.5 / 0.9);
    // Unit outer radius is 1; consecutive atoms are closer than 2.
    expect(spacing).toBeLessThan(2);
  });

  it("shades every other atom by default, still overlapping", () => {
    const { atoms, circles } = plotDotScaleLayout();
    expect(atoms).toHaveLength(9);
    const shaded = atoms.filter((a) => a.value != null);
    expect(shaded.map((a) => a.value)).toEqual([1, 0.75, 0.5, 0.25, 0]);
    const dy = shaded[1]!.cy - shaded[0]!.cy;
    expect(dy).toBeCloseTo(plotDotScaleSpacing(1));
    expect(dy).toBeLessThan(2);
    expect(circles.length).toBeGreaterThan(shaded.length);
  });

  it("paints low |color| rings from all dots before hotter centers", () => {
    const { circles } = plotDotScaleLayout();
    const keys = circles.map((c) => [Math.abs(c.color), c.radius]);
    const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(keys).toEqual(sorted);
  });

  it("shades all 9 slots when dense", () => {
    const { atoms } = plotDotScaleLayout({ dense: true });
    expect(atoms.every((a) => a.value != null)).toBe(true);
    expect(atoms[0]?.label).toBe("1.0");
    expect(atoms[4]?.label).toBe("0.5");
    expect(atoms[8]?.label).toBe("0.0");
  });
});

describe("plotDotScaleBarSvg", () => {
  it("emits a namespaced SVG with labels", () => {
    const { svg, alt, width, height } = plotDotScaleBarSvg({ size: 32 });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain(">1.0</text>");
    expect(svg).toContain(">0.5</text>");
    expect(svg).toContain(">0.0</text>");
    expect(alt).toBe("Probability scale from 0.0 to 1.0");
    expect(width).toBe(32);
    expect(height).toBeGreaterThan(width);
  });
});
