import { describe, expect, it } from "vitest";
import {
  appendMetaboliteGeneration,
  appendMetaboliteSegment,
  encodeHeadParam,
  focusQuery,
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  somToSearchParams,
  withGenerationModel,
} from "./metabolitePath";

describe("parseMoleculeFocusPath / moleculeFocusUrl", () => {
  it("round-trips root paths", () => {
    const root = parseMoleculeFocusPath("/epoxidation/aspirin");
    expect(root).toEqual({
      model: "epoxidation",
      segments: ["aspirin"],
      generations: [{ model: "epoxidation", query: "aspirin" }],
    });
    expect(moleculeFocusUrl(root!)).toBe("/epoxidation/aspirin");
  });

  it("parses legacy /m/{query} hops as inheriting the prior model", () => {
    const nested = parseMoleculeFocusPath("/ugt/foo/m/CCO/m/CC");
    expect(nested).toEqual({
      model: "ugt",
      segments: ["foo", "CCO", "CC"],
      generations: [
        { model: "ugt", query: "foo" },
        { model: "ugt", query: "CCO" },
        { model: "ugt", query: "CC" },
      ],
    });
    // Canonical URLs always emit explicit per-hop models.
    expect(moleculeFocusUrl(nested!)).toBe("/ugt/foo/m/ugt/CCO/m/ugt/CC");
  });

  it("parses explicit per-hop models", () => {
    const path = parseMoleculeFocusPath("/phase1/h/m/ugt/CCO/m/epoxidation/CC");
    expect(path?.generations).toEqual([
      { model: "phase1", query: "h" },
      { model: "ugt", query: "CCO" },
      { model: "epoxidation", query: "CC" },
    ]);
    expect(moleculeFocusUrl(path!)).toBe(
      "/phase1/h/m/ugt/CCO/m/epoxidation/CC",
    );
  });

  it("encodes special SMILES characters", () => {
    const url = moleculeFocusUrl({
      generations: [
        { model: "phase1", query: "parent" },
        { model: "phase1", query: "C(=O)O" },
      ],
    });
    expect(url).toBe("/phase1/parent/m/phase1/C(%3DO)O");
    expect(parseMoleculeFocusPath(url)?.generations[1].query).toBe("C(=O)O");
  });

  it("rejects malformed /m/ chains", () => {
    expect(parseMoleculeFocusPath("/epoxidation/aspirin/m")).toBeNull();
    expect(parseMoleculeFocusPath("/epoxidation")).toBeNull();
  });

  it("withGenerationModel changes only one hop", () => {
    const path = parseMoleculeFocusPath("/phase1/aspirin/m/ugt/CCO")!;
    expect(
      moleculeFocusUrl({
        generations: withGenerationModel(path.generations, 0, "quinone"),
      }),
    ).toBe("/quinone/aspirin/m/ugt/CCO");
    expect(
      moleculeFocusUrl({
        generations: withGenerationModel(path.generations, 1, "epoxidation"),
      }),
    ).toBe("/phase1/aspirin/m/epoxidation/CCO");
  });
});

describe("focus helpers", () => {
  it("focusQuery is the leaf", () => {
    expect(focusQuery(["a", "b", "c"])).toBe("c");
  });

  it("appendMetaboliteGeneration extends the stack with a model", () => {
    expect(
      appendMetaboliteGeneration(
        [{ model: "phase1", query: "h" }],
        "CCO",
      ),
    ).toEqual([
      { model: "phase1", query: "h" },
      { model: "phase1", query: "CCO" },
    ]);
    expect(
      appendMetaboliteGeneration(
        [{ model: "phase1", query: "h" }],
        "CCO",
        "ugt",
      ),
    ).toEqual([
      { model: "phase1", query: "h" },
      { model: "ugt", query: "CCO" },
    ]);
  });

  it("appendMetaboliteSegment extends query segments", () => {
    expect(appendMetaboliteSegment(["a"], "b")).toEqual(["a", "b"]);
  });
});

describe("SOM search params", () => {
  it("parses and serializes atoms and bonds", () => {
    const p = new URLSearchParams("atom=3&atom=1&bond=2");
    const som = parseSomSearchParams(p);
    expect(som.atomIdxs).toEqual([1, 3]);
    expect(som.bondIdx).toBe(2);
    const out = somToSearchParams(som);
    expect(out.getAll("atom")).toEqual(["1", "3"]);
    expect(out.get("bond")).toBe("2");
  });

  it("round-trips head slug / index", () => {
    const p = new URLSearchParams("head=hydrolysis&atom=1");
    expect(parseSomSearchParams(p).head).toBe("hydrolysis");
    expect(
      somToSearchParams({ head: "hydrolysis", atomIdxs: [1] }).get("head"),
    ).toBe("hydrolysis");
  });
});

describe("resolveHeadIndex / encodeHeadParam", () => {
  const results = [
    { model: "phase1.stable_oxygenation" },
    { model: "phase1.hydrolysis" },
  ];

  it("resolves numeric head indices", () => {
    expect(resolveHeadIndex("1", results)).toBe(1);
    expect(resolveHeadIndex("9", results)).toBeNull();
  });

  it("resolves head by slug or full model id", () => {
    expect(resolveHeadIndex("hydrolysis", results)).toBe(1);
    expect(resolveHeadIndex("phase1.stable_oxygenation", results)).toBe(0);
  });

  it("encodes a readable head slug when possible", () => {
    expect(encodeHeadParam(1, results)).toBe("hydrolysis");
    expect(encodeHeadParam(0, [{ model: undefined }])).toBe("0");
  });
});
