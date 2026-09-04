import { describe, expect, it } from "vitest";
import { isSearchBoxNavigation } from "~/utils/navigationLoading";
import { shouldRevalidateRootMolecule } from "~/molecule-focus/root";
import { nestedGenerationsKey } from "~/molecule-focus/nested";
import {
  parseMoleculeFocusPath,
  withGenerationModel,
} from "~/utils/metabolitePath";

describe("isSearchBoxNavigation", () => {
  it("is false for nested /m/ or SOM navigations when the draft query matches", () => {
    expect(isSearchBoxNavigation("aspirin", "aspirin", "loading")).toBe(false);
    expect(isSearchBoxNavigation("aspirin", "aspirin", "idle")).toBe(false);
  });

  it("is true only while the search box is changing the root molecule", () => {
    expect(isSearchBoxNavigation("aspirin", "caffeine", "loading")).toBe(true);
    expect(isSearchBoxNavigation("aspirin", "caffeine", "idle")).toBe(false);
  });
});

describe("nested route revalidation contract", () => {
  it("keeps the root molecule loader stable across /m/ hops", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "phase1", query: "aspirin" },
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

  it("nested model tab changes only the child generations key", () => {
    const path = parseMoleculeFocusPath(
      "/phase1/aspirin/m/phase1/O=C(O)c1ccccc1O",
    )!;
    const swapped = withGenerationModel(path.generations, 1, "ugt");
    expect(nestedGenerationsKey(path.generations)).not.toBe(
      nestedGenerationsKey(swapped),
    );
    // Root hop unchanged
    expect(swapped[0]).toEqual({ model: "phase1", query: "aspirin" });
  });
});
