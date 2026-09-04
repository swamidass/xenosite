import { describe, expect, it } from "vitest";
import { shouldRevalidateRootMolecule } from "~/molecule-focus/root";
import { nestedGenerationsKey } from "~/molecule-focus/nested";

describe("shouldRevalidateRootMolecule", () => {
  it("revalidates when root model or query changes", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "h" },
        { model: "ugt", query: "h" },
      ),
    ).toBe(true);
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "h" },
        { model: "phase1", query: "aspirin" },
      ),
    ).toBe(true);
  });

  it("skips revalidation when only nested hops would change", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "h" },
        { model: "phase1", query: "h" },
      ),
    ).toBe(false);
  });
});

describe("nestedGenerationsKey", () => {
  it("ignores the root generation", () => {
    expect(
      nestedGenerationsKey([
        { model: "phase1", query: "h" },
        { model: "ugt", query: "CCO" },
      ]),
    ).toBe(JSON.stringify([{ model: "ugt", query: "CCO" }]));
  });

  it("changes when a nested model changes", () => {
    const a = nestedGenerationsKey([
      { model: "phase1", query: "h" },
      { model: "ugt", query: "CCO" },
    ]);
    const b = nestedGenerationsKey([
      { model: "phase1", query: "h" },
      { model: "quinone", query: "CCO" },
    ]);
    expect(a).not.toBe(b);
  });
});
