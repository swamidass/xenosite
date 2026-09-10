import { describe, expect, it } from "vitest";
import {
  METS_ALL_PARAM,
  METS_OPEN_PARAM,
  depthSetHas,
  keepPanelSearch,
  metabolitePanelChrome,
  metabolitesExpandedByDefault,
  truncatePanelSearch,
  withDepthSet,
} from "./metabolitePanelView";

describe("metabolitesExpandedByDefault", () => {
  it("opens the grid when nothing is selected", () => {
    expect(metabolitesExpandedByDefault(false)).toBe(true);
  });

  it("collapses the grid when a metabolite hop is selected", () => {
    expect(metabolitesExpandedByDefault(true)).toBe(false);
  });
});

describe("metabolitePanelChrome", () => {
  it("unselected: no toggle, grid visible when metabolites exist", () => {
    expect(
      metabolitePanelChrome({
        hasSelection: false,
        expanded: true,
        hasMetabolites: true,
      }),
    ).toEqual({
      showToggle: false,
      showGrid: true,
      showClear: false,
      toggleLabel: null,
    });
  });

  it("selected + collapsed: Show metabolites, no grid, no Clear", () => {
    expect(
      metabolitePanelChrome({
        hasSelection: true,
        expanded: false,
        hasMetabolites: true,
      }),
    ).toEqual({
      showToggle: true,
      showGrid: false,
      showClear: false,
      toggleLabel: "Show metabolites",
    });
  });

  it("selected + expanded: Hide metabolites, grid + Clear", () => {
    expect(
      metabolitePanelChrome({
        hasSelection: true,
        expanded: true,
        hasMetabolites: true,
      }),
    ).toEqual({
      showToggle: true,
      showGrid: true,
      showClear: true,
      toggleLabel: "Hide metabolites",
    });
  });

  it("selected + expanded with empty pool: toggle + Clear, no grid", () => {
    expect(
      metabolitePanelChrome({
        hasSelection: true,
        expanded: true,
        hasMetabolites: false,
      }),
    ).toEqual({
      showToggle: true,
      showGrid: false,
      showClear: true,
      toggleLabel: "Hide metabolites",
    });
  });
});

describe("panel depth-set search params", () => {
  it("reads and writes comma-separated depths", () => {
    const p = new URLSearchParams("open=0,2");
    expect(depthSetHas(p, METS_OPEN_PARAM, 0)).toBe(true);
    expect(depthSetHas(p, METS_OPEN_PARAM, 1)).toBe(false);
    expect(withDepthSet(p, METS_ALL_PARAM, 1, true).get("all")).toBe("1");
    expect(withDepthSet(p, METS_OPEN_PARAM, 0, false).get("open")).toBe("2");
  });

  it("keepPanelSearch preserves open/all only", () => {
    const kept = keepPanelSearch("atom=3&open=0&all=0,1&head=x");
    expect(kept.toString()).toBe("open=0&all=0%2C1");
  });

  it("truncatePanelSearch drops deeper depths", () => {
    expect(truncatePanelSearch("open=0,2&all=1,2&head=x", 1)).toBe(
      "open=0&all=1",
    );
    expect(truncatePanelSearch("open=2&all=2", 0)).toBe("");
  });
});
