import { describe, expect, it, vi, afterEach } from "vitest";
import { compensateScrollForAnchorShift } from "./scrollAnchor";

describe("compensateScrollForAnchorShift", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when there is no previous top", () => {
    const scrollBy = vi.fn();
    vi.stubGlobal("window", { scrollBy });
    expect(compensateScrollForAnchorShift(null, 100)).toBe(100);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("scrolls by the anchor delta so content above stays put", () => {
    const scrollBy = vi.fn();
    vi.stubGlobal("window", { scrollBy });
    // Panel shrank; anchor (banner) moved up by 80px in the viewport.
    expect(compensateScrollForAnchorShift(200, 120)).toBe(120);
    expect(scrollBy).toHaveBeenCalledWith(0, -80);
  });

  it("ignores sub-pixel jitter", () => {
    const scrollBy = vi.fn();
    vi.stubGlobal("window", { scrollBy });
    expect(compensateScrollForAnchorShift(200, 200.2)).toBe(200.2);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
