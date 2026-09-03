import { describe, expect, it } from "vitest";
import { displayPointToSvg, parseDepictionMetadata } from "./moleculeSvg";

const SAMPLE_SVG = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="10 20 100 80">
  <g></g>
  <script type="application/json">{"coords": [[15.0, 25.0], [50.5, 60.0]], "scale": 20}</script>
</svg>`;

describe("parseDepictionMetadata", () => {
  it("parses viewBox, coords, and scale from embedded JSON", () => {
    const meta = parseDepictionMetadata(SAMPLE_SVG);
    expect(meta).not.toBeNull();
    expect(meta!.viewBox).toEqual({ x: 10, y: 20, width: 100, height: 80 });
    expect(meta!.scale).toBe(20);
    expect(meta!.coords).toEqual([
      [15, 25],
      [50.5, 60],
    ]);
  });

  it("returns null without JSON script", () => {
    expect(
      parseDepictionMetadata(
        `<svg viewBox="0 0 10 10"><g/></svg>`,
      ),
    ).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseDepictionMetadata("")).toBeNull();
  });

  it("falls back to width/height when viewBox missing", () => {
    const svg = `<svg width="40" height="30"><script type="application/json">{"coords":[[1,2]],"scale":10}</script></svg>`;
    const meta = parseDepictionMetadata(svg);
    expect(meta!.viewBox).toEqual({ x: 0, y: 0, width: 40, height: 30 });
  });
});

describe("displayPointToSvg", () => {
  it("maps display pixels into SVG user space", () => {
    const pt = displayPointToSvg(
      50,
      40,
      { width: 100, height: 80 },
      { x: 10, y: 20, width: 100, height: 80 },
    );
    expect(pt.x).toBeCloseTo(60);
    expect(pt.y).toBeCloseTo(60);
  });

  it("handles top-left corner", () => {
    const pt = displayPointToSvg(
      0,
      0,
      { width: 200, height: 100 },
      { x: 5, y: 7, width: 40, height: 20 },
    );
    expect(pt).toEqual({ x: 5, y: 7 });
  });
});
