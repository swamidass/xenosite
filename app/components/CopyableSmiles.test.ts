import { describe, expect, it } from "vitest";
import {
  COPIED_SMILES_HINT,
  COPY_SMILES_HINT,
} from "~/components/CopyableSmiles";

describe("CopyableSmiles hints", () => {
  it("uses copy / copied tooltip copy", () => {
    expect(COPY_SMILES_HINT).toBe("Copy to clipboard");
    expect(COPIED_SMILES_HINT).toBe("Copied");
  });
});
