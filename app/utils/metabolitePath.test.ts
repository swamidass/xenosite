import { describe, expect, it } from "vitest";
import {
  appendMetaboliteSegment,
  encodeHeadParam,
  focusQuery,
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  somToSearchParams,
} from "./metabolitePath";

describe("parseMoleculeFocusPath / moleculeFocusUrl", () => {
  it("round-trips root and nested paths", () => {
    const root = parseMoleculeFocusPath("/epoxidation/aspirin");
    expect(root).toEqual({ model: "epoxidation", segments: ["aspirin"] });
    expect(moleculeFocusUrl(root!)).toBe("/epoxidation/aspirin");

    const nested = parseMoleculeFocusPath("/ugt/foo/m/CCO/m/CC");
    expect(nested).toEqual({
      model: "ugt",
      segments: ["foo", "CCO", "CC"],
    });
    expect(moleculeFocusUrl(nested!)).toBe("/ugt/foo/m/CCO/m/CC");
  });

  it("encodes special SMILES characters", () => {
    const url = moleculeFocusUrl({
      model: "phase1",
      segments: ["parent", "C(=O)O"],
    });
    expect(url).toBe("/phase1/parent/m/C(%3DO)O");
    expect(parseMoleculeFocusPath(url)?.segments[1]).toBe("C(=O)O");
  });

  it("rejects malformed /m/ chains", () => {
    expect(parseMoleculeFocusPath("/epoxidation/aspirin/m")).toBeNull();
    expect(parseMoleculeFocusPath("/epoxidation")).toBeNull();
  });

  it("preserves model when swapping only the first segment", () => {
    const path = parseMoleculeFocusPath("/epoxidation/aspirin/m/CCO")!;
    expect(
      moleculeFocusUrl({ model: "ugt", segments: path.segments }),
    ).toBe("/ugt/aspirin/m/CCO");
  });
});

describe("focus helpers", () => {
  it("focusQuery is the leaf", () => {
    expect(focusQuery(["a", "b", "c"])).toBe("c");
  });

  it("appendMetaboliteSegment extends the stack", () => {
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
