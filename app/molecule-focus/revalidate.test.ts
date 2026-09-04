import { describe, expect, it } from "vitest";
import { shouldRevalidateRootMolecule } from "~/molecule-focus/root";
import { shouldRevalidateHop } from "~/molecule-focus/hop";
import { nestedStackKey } from "~/utils/navigationLoading";

describe("shouldRevalidateRootMolecule", () => {
  it("skips when root model and smiles are unchanged", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "phase1", query: "aspirin" },
      ),
    ).toBe(false);
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "phase1", query: "aspirin;1,2" },
      ),
    ).toBe(false);
  });

  it("revalidates when root model or smiles changes", () => {
    expect(
      shouldRevalidateRootMolecule(
        { model: "phase1", query: "aspirin" },
        { model: "ugt", query: "aspirin" },
      ),
    ).toBe(true);
  });
});

describe("shouldRevalidateHop", () => {
  it("only watches this hop's params; ignores SOM-only mol stub edits", () => {
    const cur = {
      model: "phase1",
      query: "a",
      met1: "CCO;0",
      m1: "ugt",
      q1: "CCO",
      met2: "CC",
      m2: "ugt",
      q2: "CC",
    };
    expect(shouldRevalidateHop(1, cur, { ...cur, q1: "CCC" })).toBe(true);
    expect(shouldRevalidateHop(1, cur, { ...cur, q1: "CCO;1,2" })).toBe(false);
    expect(shouldRevalidateHop(1, cur, { ...cur, q2: "CCC" })).toBe(false);
  });
});

describe("nestedStackKey", () => {
  it("fingerprints nested hops only", () => {
    expect(
      nestedStackKey([
        { model: "phase1", query: "a" },
        { model: "ugt", query: "b" },
      ]),
    ).toBe(JSON.stringify([{ model: "ugt", query: "b" }]));
  });

  it("changes when a nested model or query changes", () => {
    const a = nestedStackKey([
      { model: "phase1", query: "a" },
      { model: "_", query: "b" },
    ]);
    const b = nestedStackKey([
      { model: "phase1", query: "a" },
      { model: "ugt", query: "b" },
    ]);
    expect(a).not.toBe(b);
  });
});
