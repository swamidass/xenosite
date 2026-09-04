import { describe, expect, it } from "vitest";
import {
  generationMarkerLabel,
  generationNumber,
  generationSectionLabel,
  pathHopLabel,
  SUBSTRATE_LABEL,
} from "~/utils/generationMarker";

describe("generationNumber", () => {
  it("is 1-based from 0-based depth for metabolite sections", () => {
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
  it("labels metabolite sections produced at that depth", () => {
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

describe("pathHopLabel", () => {
  it("labels the root as Substrate and nested hops as Generation N", () => {
    expect(pathHopLabel(0)).toBe(SUBSTRATE_LABEL);
    expect(pathHopLabel(1)).toBe("Generation 1");
    expect(pathHopLabel(2)).toBe("Generation 2");
  });
});
