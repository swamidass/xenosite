import { describe, expect, it } from "vitest";
import { paintSmilesServer } from "~/utils/xpictPaint.server";

describe("paintSmilesServer", () => {
  it("paints a SMILES to SVG without calling the prediction API", async () => {
    const svg = await paintSmilesServer("CCO", {
      atomScores: [0.1, 0.5, 0.9],
    });
    expect(svg).toContain("<svg");
    expect(svg.length).toBeGreaterThan(50);
  });

  it("rejects empty SMILES", async () => {
    await expect(paintSmilesServer("  ")).rejects.toThrow(/non-empty/);
  });
});
