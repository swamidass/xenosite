import { describe, expect, it } from "vitest";
import { MODELS } from "~/data";
import { getLdJson } from "~/loaders/ld-json";

describe("getLdJson", () => {
  it("always includes organization, website, and breadcrumbs", () => {
    const nodes = getLdJson();
    const types = nodes.map((n) => n["@type"]);
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    expect(types).toContain("BreadcrumbList");
  });

  it("adds software, citation, chemical, and image nodes for a molecule page", () => {
    const phase1 = MODELS.find((m) => m.path === "phase1")!;
    const nodes = getLdJson({
      model: phase1,
      name: "aspirin",
      description: "test",
      xenositeUrl: "https://xenosite.org/phase1/aspirin",
      ogImageUrl: "https://xenosite.org/og/phase1/aspirin",
      smiles: "CC(=O)Oc1ccccc1C(=O)O",
      chebi: "15365",
      chebiUrl: "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:15365",
      citation: phase1.citation,
      results: ["phase1.hydrolysis", "phase1.stable_oxygenation"],
    });
    const types = nodes.map((n) => n["@type"]);
    expect(types).toContain("WebApplication");
    expect(types).toContain("ScholarlyArticle");
    expect(types).toContain("ChemicalSubstance");
    expect(types).toContain("ImageObject");
    const image = nodes.find((n) => n["@type"] === "ImageObject");
    expect(image.name).toMatch(/hydrolysis/i);
  });

  it("labels the all-models image without a submodel suffix", () => {
    const nodes = getLdJson({
      model: {
        ...MODELS[0]!,
        model: "All Models",
        path: "_",
      },
      name: "caffeine",
      ogImageUrl: "https://xenosite.org/og/_/caffeine",
      results: ["phase1.hydrolysis"],
    });
    const image = nodes.find((n) => n["@type"] === "ImageObject");
    expect(image.name).toContain("All Models");
  });
});
