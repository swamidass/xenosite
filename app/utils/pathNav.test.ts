import { describe, expect, it } from "vitest";
import {
  buildPathCrumbs,
  popGenerationUrl,
  trimGenerationsUrl,
} from "~/utils/pathNav";

const gens = [
  { model: "phase1", query: "aspirin" },
  { model: "phase1", query: "O=C(O)c1ccccc1O" },
  { model: "ugt", query: "CCOc1ccccc1" },
];

describe("buildPathCrumbs", () => {
  it("builds jump hrefs for ancestors and marks the leaf current", () => {
    const crumbs = buildPathCrumbs({
      generations: gens,
      names: [{ name: "aspirin" }, { name: "salicylic acid" }, null],
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toMatchObject({
      depth: 0,
      label: "Aspirin",
      current: false,
      href: "/phase1/aspirin",
    });
    expect(crumbs[1]).toMatchObject({
      depth: 1,
      label: "Salicylic acid",
      current: false,
      href: "/phase1/aspirin/m/phase1/O%3DC(O)c1ccccc1O",
    });
    expect(crumbs[2]).toMatchObject({
      depth: 2,
      label: "Metabolite",
      current: true,
      href: undefined,
      title: "CCOc1ccccc1",
    });
  });

  it("never uses SMILES as the crumb label when unnamed", () => {
    const crumbs = buildPathCrumbs({
      generations: gens.slice(0, 2),
      names: [null, null],
    });
    expect(crumbs[0].label).toBe("Aspirin"); // from query string capitalize
    expect(crumbs[1].label).toBe("Metabolite");
    expect(crumbs[1].label).not.toContain("=");
  });
});

describe("popGenerationUrl / trimGenerationsUrl", () => {
  it("pops the leaf hop", () => {
    expect(popGenerationUrl(gens)).toBe(
      "/phase1/aspirin/m/phase1/O%3DC(O)c1ccccc1O",
    );
    expect(popGenerationUrl(gens.slice(0, 1))).toBeNull();
  });

  it("trims to a parent depth", () => {
    expect(trimGenerationsUrl(gens, 1)).toBe("/phase1/aspirin");
    expect(trimGenerationsUrl(gens, 2)).toBe(
      "/phase1/aspirin/m/phase1/O%3DC(O)c1ccccc1O",
    );
  });
});
