import { describe, expect, it } from "vitest";
import {
  generationMarkerLabel,
  generationNumber,
  generationSectionLabel,
} from "~/utils/generationMarker";

describe("generationNumber", () => {
  it("is 1-based from 0-based depth", () => {
    expect(generationNumber(0)).toBe(1);
    expect(generationNumber(1)).toBe(2);
    expect(generationNumber(2.9)).toBe(3);
  });

  it("clamps invalid depths to Generation 1", () => {
    expect(generationNumber(-1)).toBe(1);
    expect(generationNumber(Number.NaN)).toBe(1);
  });
});

describe("generationMarkerLabel", () => {
  it("spells out Generation with 1-based index", () => {
    expect(generationMarkerLabel(0)).toBe("Generation 1");
    expect(generationMarkerLabel(1)).toBe("Generation 2");
  });
});

describe("generationSectionLabel", () => {
  it("matches the marker label", () => {
    expect(generationSectionLabel(0)).toBe("Generation 1");
    expect(generationSectionLabel(1)).toBe("Generation 2");
  });
});
