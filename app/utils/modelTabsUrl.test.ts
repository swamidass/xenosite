import { describe, expect, it } from "vitest";
import {
  moleculeFocusUrl,
  modelTabSearchFromLocation,
  parseMoleculeFocusPath,
  withGenerationModel,
} from "./metabolitePath";

describe("model tab URL", () => {
  it("root tab swap clears nested metabolite hops", () => {
    const parsed = parseMoleculeFocusPath(
      "/epoxidation/aspirin/CCO/ugt/CCO/CC/phase1/CC",
    );
    expect(parsed).not.toBeNull();
    const url = moleculeFocusUrl({
      generations: withGenerationModel(parsed!.generations, 0, "quinone"),
    });
    expect(url).toBe("/quinone/aspirin");
  });

  it("nested tab swap keeps ancestors and clears deeper hops", () => {
    const parsed = parseMoleculeFocusPath(
      "/phase1/aspirin/CCO/ugt/CCO/CC/epoxidation/CC",
    )!;
    const url = moleculeFocusUrl({
      generations: withGenerationModel(parsed.generations, 1, "quinone"),
    });
    expect(url).toBe("/phase1/aspirin/CCO/quinone/CCO");
  });

  it("drops formation search params (formation lives in the path stub)", () => {
    expect(
      modelTabSearchFromLocation(
        "atom=1&atom=2&head=quinone&pathway=QuinoneFormation&score=0.31",
      ),
    ).toBe("");
  });
});
