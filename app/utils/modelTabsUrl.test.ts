import { describe, expect, it } from "vitest";
import {
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  withGenerationModel,
} from "./metabolitePath";

describe("model tab URL preservation", () => {
  it("root tab swap keeps nested hop models", () => {
    const parsed = parseMoleculeFocusPath(
      "/epoxidation/aspirin/m/ugt/CCO/m/phase1/CC",
    );
    expect(parsed).not.toBeNull();
    const url = moleculeFocusUrl({
      generations: withGenerationModel(parsed!.generations, 0, "quinone"),
    });
    expect(url).toBe("/quinone/aspirin/m/ugt/CCO/m/phase1/CC");
  });

  it("nested tab swap keeps the root model", () => {
    const parsed = parseMoleculeFocusPath("/phase1/aspirin/m/ugt/CCO")!;
    const url = moleculeFocusUrl({
      generations: withGenerationModel(parsed.generations, 1, "quinone"),
    });
    expect(url).toBe("/phase1/aspirin/m/quinone/CCO");
  });
});
