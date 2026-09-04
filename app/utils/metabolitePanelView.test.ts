import { describe, expect, it } from "vitest";
import {
  metabolitePanelChrome,
  metabolitesExpandedByDefault,
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
