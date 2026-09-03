import { describe, expect, it } from "vitest";
import {
  moleculeFocusUrl,
  parseMoleculeFocusPath,
} from "./metabolitePath";

describe("model tab URL preservation", () => {
  it("swaps only the model segment and keeps /m/ hops", () => {
    const parsed = parseMoleculeFocusPath("/epoxidation/aspirin/m/CCO/m/CC");
    expect(parsed).not.toBeNull();
    const url = moleculeFocusUrl({
      model: "quinone",
      segments: parsed!.segments,
    });
    expect(url).toBe("/quinone/aspirin/m/CCO/m/CC");
  });
});
