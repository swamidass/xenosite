/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import XpictMoleculeDepiction from "~/components/XpictMoleculeDepiction";

vi.mock("~/utils/xpictClient.client", () => ({
  paintSmiles: vi.fn(async () => ({
    svg: `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="5"/></svg>`,
    coords: [
      [10, 10],
      [30, 30],
    ] as [number, number][],
    bondsIdx: [[0, 1]] as [number, number][],
    width: 40,
    height: 40,
    scale: 20,
    rendered: {} as never,
  })),
}));

describe("XpictMoleculeDepiction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { clearAllXpictPaint } = await import(
      "~/utils/xpictPaintResource.client"
    );
    clearAllXpictPaint();
  });
  afterEach(() => cleanup());

  it("paints from SMILES via Suspense and exposes an img with alt", async () => {
    const { paintSmiles } = await import("~/utils/xpictClient.client");
    render(
      <XpictMoleculeDepiction
        smiles="CCO"
        alt="ethanol"
        atomScores={[0.1, 0.5, 0.9]}
      />,
    );
    await waitFor(() => {
      expect(paintSmiles).toHaveBeenCalled();
    });
    const img = await screen.findByRole("img", { name: "ethanol" });
    await waitFor(() => {
      expect(img.className).not.toContain("sr-only");
      expect(img.getAttribute("src") || "").toContain("data:image/svg+xml");
    });
  });
});
