import { describe, expect, it } from "vitest";
import {
  isNestedPredictionNavigation,
  isSearchBoxNavigation,
  nestedStackKey,
} from "~/utils/navigationLoading";
import { shouldRevalidateRootMolecule } from "~/molecule-focus/root";
import { shouldRevalidateHop } from "~/molecule-focus/hop";
import {
  parseMoleculeFocusPath,
  withGenerationModel,
} from "~/utils/metabolitePath";

describe("isSearchBoxNavigation", () => {
  it("is false for nested hops or SOM navigations when the draft query matches", () => {
    expect(isSearchBoxNavigation("aspirin", "aspirin", "loading")).toBe(false);
    expect(isSearchBoxNavigation("aspirin", "aspirin", "idle")).toBe(false);
  });

  it("is true only while the search box is changing the root molecule", () => {
    expect(isSearchBoxNavigation("aspirin", "caffeine", "loading")).toBe(true);
    expect(isSearchBoxNavigation("aspirin", "caffeine", "idle")).toBe(false);
  });
});

describe("isNestedPredictionNavigation", () => {
  const parse = parseMoleculeFocusPath;

  it("is true when selecting or replacing a nested metabolite hop", () => {
    expect(
      isNestedPredictionNavigation(
        "/phase1/phenol",
        "/phase1/phenol/" + encodeURIComponent("Oc1cccc(O)c1;0"),
        "loading",
        parse,
      ),
    ).toBe(true);
    expect(
      isNestedPredictionNavigation(
        "/phase1/phenol/Oc1cccc(O)c1/phase1/Oc1cccc(O)c1",
        "/phase1/phenol/Oc1cc(O)cc(O)c1/phase1/Oc1cc(O)cc(O)c1",
        "loading",
        parse,
      ),
    ).toBe(true);
  });

  it("is true when a nested hop changes prediction model", () => {
    expect(
      isNestedPredictionNavigation(
        "/phase1/aspirin/" + encodeURIComponent("O=C(O)c1ccccc1O"),
        "/phase1/aspirin/" +
          encodeURIComponent("O=C(O)c1ccccc1O") +
          "/ugt/" +
          encodeURIComponent("O=C(O)c1ccccc1O"),
        "loading",
        parse,
      ),
    ).toBe(true);
  });

  it("is false for SOM-only navigations and idle", () => {
    expect(
      isNestedPredictionNavigation(
        "/phase1/phenol/Oc1cccc(O)c1/phase1/Oc1cccc(O)c1",
        "/phase1/" +
          encodeURIComponent("phenol;1,2") +
          "/Oc1cccc(O)c1/phase1/Oc1cccc(O)c1",
        "loading",
        parse,
      ),
    ).toBe(false);
    expect(
      isNestedPredictionNavigation(
        "/phase1/phenol",
        "/phase1/phenol/Oc1cccc(O)c1",
        "idle",
        parse,
      ),
    ).toBe(false);
  });
});

describe("per-hop revalidation", () => {
  it("keeps the root molecule loader stable across nested hops", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "phase1", query: "aspirin" },
      ),
    ).toBe(false);
  });

  it("keeps the root loader stable when only SOM on the mol stub changes", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "phenol" },
        { model: "phase1", query: "phenol;1,2" },
      ),
    ).toBe(false);
  });

  it("revalidates the root molecule when the root query or model changes", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "ugt", query: "aspirin" },
      ),
    ).toBe(true);
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "phase1", query: "h" },
      ),
    ).toBe(true);
  });

  it("revalidates only the hop whose mN/qN/met changed", () => {
    const base = {
      model: "phase1",
      query: "aspirin",
      met1: "CCO",
      m1: "ugt",
      q1: "CCO",
      met2: "CC",
      m2: "phase1",
      q2: "CC",
    };
    expect(shouldRevalidateHop(1, base, { ...base, m1: "quinone" })).toBe(true);
    expect(shouldRevalidateHop(1, base, { ...base, q2: "CCC" })).toBe(false);
    expect(shouldRevalidateHop(2, base, { ...base, q2: "CCC" })).toBe(true);
    expect(
      shouldRevalidateHop(1, base, { ...base, q1: "CCO;1,2" }),
    ).toBe(false);
  });

  it("nested model tab changes only the child stack key", () => {
    const path = parseMoleculeFocusPath(
      "/phase1/aspirin/O=C(O)c1ccccc1O/phase1/O=C(O)c1ccccc1O",
    )!;
    const swapped = withGenerationModel(path.generations, 1, "ugt");
    expect(nestedStackKey(path.generations)).not.toBe(nestedStackKey(swapped));
    expect(swapped[0]).toMatchObject({ model: "phase1", query: "aspirin" });
  });
});
