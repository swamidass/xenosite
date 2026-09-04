import { describe, expect, it } from "vitest";
import {
  generationMarkerLabel,
  generationSectionLabel,
} from "~/utils/generationMarker";

describe("generationMarkerLabel", () => {
  it("formats stable Gen N labels", () => {
    expect(generationMarkerLabel(0)).toBe("Gen 0");
    expect(generationMarkerLabel(1)).toBe("Gen 1");
    expect(generationMarkerLabel(2.9)).toBe("Gen 2");
  });

  it("clamps invalid depths to Gen 0", () => {
    expect(generationMarkerLabel(-1)).toBe("Gen 0");
    expect(generationMarkerLabel(Number.NaN)).toBe("Gen 0");
  });
});

describe("generationSectionLabel", () => {
  it("distinguishes parent vs metabolite generations", () => {
    expect(generationSectionLabel(0)).toBe("Parent molecule");
    expect(generationSectionLabel(1)).toBe("Metabolite generation 1");
  });
});
