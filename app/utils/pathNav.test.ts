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
  it("builds Substrate / Generation N crumbs without molecule names", () => {
    const crumbs = buildPathCrumbs({ generations: gens });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toMatchObject({
      depth: 0,
      label: "Substrate",
      current: false,
      href: "/phase1/aspirin",
      title: "aspirin",
    });
    expect(crumbs[1]).toMatchObject({
      depth: 1,
      label: "Generation 1",
      current: false,
      href:
        "/phase1/aspirin/" +
        encodeURIComponent("O=C(O)c1ccccc1O") +
        "/phase1/" +
        encodeURIComponent("O=C(O)c1ccccc1O"),
      title: "O=C(O)c1ccccc1O",
    });
    expect(crumbs[2]).toMatchObject({
      depth: 2,
      label: "Generation 2",
      current: true,
      href: undefined,
      title: "CCOc1ccccc1",
    });
  });
});

describe("popGenerationUrl / trimGenerationsUrl", () => {
  it("pops the leaf hop", () => {
    expect(popGenerationUrl(gens)).toBe(
      "/phase1/aspirin/" +
        encodeURIComponent("O=C(O)c1ccccc1O") +
        "/phase1/" +
        encodeURIComponent("O=C(O)c1ccccc1O"),
    );
    expect(popGenerationUrl(gens.slice(0, 1))).toBeNull();
  });

  it("trims to a parent depth", () => {
    expect(trimGenerationsUrl(gens, 1)).toBe("/phase1/aspirin");
    expect(trimGenerationsUrl(gens, 2)).toBe(
      "/phase1/aspirin/" +
        encodeURIComponent("O=C(O)c1ccccc1O") +
        "/phase1/" +
        encodeURIComponent("O=C(O)c1ccccc1O"),
    );
  });
});
