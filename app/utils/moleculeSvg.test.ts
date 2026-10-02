import { describe, expect, it } from "vitest";
import {
  displayLayout,
  displayPointToSvg,
  parseDepictionMetadata,
  svgPointToDisplay,
} from "./moleculeSvg";

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

  it("falls back to height-before-width attributes", () => {
    const svg = `<svg height="30" width="40"><script type="application/json">{"coords":[[1,2]],"scale":10}</script></svg>`;
    const meta = parseDepictionMetadata(svg);
    expect(meta!.viewBox).toEqual({ x: 0, y: 0, width: 40, height: 30 });
  });

  it("returns null for invalid JSON or coords", () => {
    expect(
      parseDepictionMetadata(
        `<svg viewBox="0 0 10 10"><script type="application/json">{not json}</script></svg>`,
      ),
    ).toBeNull();
    expect(
      parseDepictionMetadata(
        `<svg viewBox="0 0 10 10"><script type="application/json">{"coords":[[1]],"scale":1}</script></svg>`,
      ),
    ).toBeNull();
  });

  it("parses HTML-escaped JSON from deployed Xenopict SVGs", () => {
    const svg = `<svg viewBox="0 0 100 80"><script type="application/json">{&quot;coords&quot;: [[18.0, 17.8], [39.4, 5.4]], &quot;scale&quot;: 20}</script></svg>`;
    const meta = parseDepictionMetadata(svg);
    expect(meta).not.toBeNull();
    expect(meta!.scale).toBe(20);
    expect(meta!.coords).toEqual([
      [18, 17.8],
      [39.4, 5.4],
    ]);
  });
});
describe("displayLayout / displayPointToSvg", () => {
  it("maps display pixels into SVG user space when aspects match", () => {
    const pt = displayPointToSvg(
      50,
      40,
      { width: 100, height: 80 },
      { x: 10, y: 20, width: 100, height: 80 },
    );
    expect(pt.x).toBeCloseTo(60);
    expect(pt.y).toBeCloseTo(60);
  });

  it("handles top-left corner when aspects match", () => {
    const pt = displayPointToSvg(
      0,
      0,
      { width: 200, height: 100 },
      { x: 5, y: 7, width: 40, height: 20 },
    );
    expect(pt).toEqual({ x: 5, y: 7 });
  });

  it("accounts for letterboxing under xMidYMid meet", () => {
    // Display taller than viewBox aspect → horizontal bars top/bottom.
    const vb = { x: 0, y: 0, width: 100, height: 50 };
    const display = { width: 200, height: 200 };
    const layout = displayLayout(display, vb);
    expect(layout.scale).toBeCloseTo(2);
    expect(layout.offsetX).toBeCloseTo(0);
    expect(layout.offsetY).toBeCloseTo(50);

    const mid = displayPointToSvg(100, 100, display, vb);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(25);

    const back = svgPointToDisplay(50, 25, vb, layout);
    expect(back.x).toBeCloseTo(100);
    expect(back.y).toBeCloseTo(100);
  });
});
