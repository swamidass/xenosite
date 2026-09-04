import { describe, expect, it } from "vitest";
import {
  appendMetaboliteGeneration,
  appendMetaboliteSegment,
  canAppendMetaboliteHop,
  encodeHeadParam,
  encodeMetaboliteSlug,
  encodeMolStub,
  focusQuery,
  generationsFromParams,
  hopParamNames,
  hopRouteId,
  moleculeFocusUrl,
  parseMetaboliteSlug,
  parseMolStub,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  selectMetaboliteGeneration,
  smilesFromMolStubParam,
  somToSearchParams,
  withGenerationModel,
  withGenerationSom,
} from "./metabolitePath";

describe("mol stub smiles[;som][;bN]", () => {
  it("round-trips smiles and som", () => {
    expect(encodeMolStub({ smiles: "phenol" })).toBe("phenol");
    expect(encodeMolStub({ smiles: "phenol", som: [2, 1] })).toBe(
      "phenol;1,2",
    );
    expect(
      encodeMolStub({ smiles: "phenol", som: [1, 2], bondIdx: 3 }),
    ).toBe("phenol;1,2;b3");
    expect(parseMolStub("phenol;1,2;b3")).toEqual({
      smiles: "phenol",
      som: [1, 2],
      bondIdx: 3,
    });
    expect(smilesFromMolStubParam("phenol;1,2")).toBe("phenol");
  });
});

describe("metabolite slug smiles;head;match", () => {
  it("round-trips concise slugs (site lives on parent mol stub)", () => {
    expect(encodeMetaboliteSlug({ smiles: "CCO" })).toBe("CCO");
    expect(encodeMetaboliteSlug({ smiles: "CCO", headIndex: 0 })).toBe(
      "CCO;0",
    );
    expect(
      encodeMetaboliteSlug({
        smiles: "CCO",
        headIndex: 0,
        matchIndex: 1,
      }),
    ).toBe("CCO;0;1");
    expect(parseMetaboliteSlug("CCO;0;1")).toEqual({
      smiles: "CCO",
      headIndex: 0,
      matchIndex: 1,
    });
  });

  it("puts som on parent mol stub and edge on metabolite segment", () => {
    const url = moleculeFocusUrl({
      generations: [
        { model: "phase1", query: "phenol", som: [1, 2] },
        {
          model: "_",
          query: "Oc1cccc(O)c1",
          headIndex: 0,
          matchIndex: 0,
        },
      ],
    });
    expect(url).toBe(
      "/phase1/" +
        encodeURIComponent("phenol;1,2") +
        "/" +
        encodeURIComponent("Oc1cccc(O)c1;0"),
    );
    expect(parseMoleculeFocusPath(url)?.generations).toMatchObject([
      { model: "phase1", query: "phenol", som: [1, 2] },
      {
        model: "_",
        query: "Oc1cccc(O)c1",
        headIndex: 0,
      },
    ]);
  });
});

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

  it("parses metabolite then model/mol", () => {
    expect(parseMoleculeFocusPath("/ugt/foo/CCO")).toEqual({
      model: "ugt",
      segments: ["foo", "CCO"],
      generations: [
        { model: "ugt", query: "foo" },
        {
          model: "_",
          query: "CCO",
          headIndex: null,
          matchIndex: null,
        },
      ],
    });
    expect(
      moleculeFocusUrl({
        generations: [
          { model: "ugt", query: "foo" },
          { model: "ugt", query: "CCO" },
          { model: "ugt", query: "CC" },
        ],
      }),
    ).toBe("/ugt/foo/CCO/ugt/CCO/CC/ugt/CC");
  });

  it("parses explicit per-hop models", () => {
    const path = parseMoleculeFocusPath(
      "/phase1/h/CCO/ugt/CCO/CC/epoxidation/CC",
    );
    expect(
      path?.generations.map((g) => ({ model: g.model, query: g.query })),
    ).toEqual([
      { model: "phase1", query: "h" },
      { model: "ugt", query: "CCO" },
      { model: "epoxidation", query: "CC" },
    ]);
    expect(moleculeFocusUrl(path!)).toBe(
      "/phase1/h/CCO/ugt/CCO/CC/epoxidation/CC",
    );
  });

  it("encodes special SMILES characters in mol stubs", () => {
    const url = moleculeFocusUrl({
      generations: [
        { model: "phase1", query: "parent" },
        { model: "phase1", query: "C(=O)O" },
      ],
    });
    expect(url).toBe(
      "/phase1/parent/" +
        encodeURIComponent("C(=O)O") +
        "/phase1/" +
        encodeURIComponent("C(=O)O"),
    );
    expect(parseMoleculeFocusPath(url)?.generations[1].query).toBe("C(=O)O");
  });

  it("rejects malformed chains", () => {
    expect(parseMoleculeFocusPath("/epoxidation/aspirin/ugt")).toBeNull();
    expect(parseMoleculeFocusPath("/epoxidation")).toBeNull();
    expect(parseMoleculeFocusPath("/phase1/h/CCO/notamodel/CCO")).toBeNull();
  });

  it("withGenerationModel changes a hop and clears deeper selections", () => {
    const path = parseMoleculeFocusPath(
      "/phase1/aspirin/CCO/ugt/CCO/CC/epoxidation/CC",
    )!;
    expect(
      moleculeFocusUrl({
        generations: withGenerationModel(path.generations, 0, "quinone"),
      }),
    ).toBe("/quinone/aspirin");
    expect(
      moleculeFocusUrl({
        generations: withGenerationModel(path.generations, 1, "epoxidation"),
      }),
    ).toBe("/phase1/aspirin/CCO/epoxidation/CCO");
  });

  it("withGenerationSom rewrites the mol stub and drops children", () => {
    const gens = [
      { model: "phase1", query: "phenol" },
      { model: "ugt", query: "Oc1cccc(O)c1", headIndex: 0 },
    ];
    expect(
      moleculeFocusUrl({
        generations: withGenerationSom(gens, 0, [1, 3], 2),
      }),
    ).toBe("/phase1/" + encodeURIComponent("phenol;1,3;b2"));
  });
});

describe("generationsFromParams / hopParamNames", () => {
  it("maps Remix params to generations", () => {
    expect(
      generationsFromParams({
        model: "phase1",
        query: "phenol;1,2",
        met1: "Oc1cccc(O)c1;0;1",
        m1: "ugt",
        q1: "Oc1cccc(O)c1",
      }),
    ).toEqual([
      {
        model: "phase1",
        query: "phenol",
        som: [1, 2],
      },
      {
        model: "ugt",
        query: "Oc1cccc(O)c1",
        headIndex: 0,
        matchIndex: 1,
      },
    ]);
  });

  it("hopParamNames uses model/query then metN/mN/qN", () => {
    expect(hopParamNames(0)).toEqual({ model: "model", query: "query" });
    expect(hopParamNames(2)).toEqual({
      met: "met2",
      model: "m2",
      query: "q2",
    });
  });

  it("canAppendMetaboliteHop respects the depth cap", () => {
    expect(canAppendMetaboliteHop(0)).toBe(true);
    expect(canAppendMetaboliteHop(4)).toBe(false);
  });
});

describe("focus helpers", () => {
  it("focusQuery is the leaf", () => {
    expect(focusQuery(["a", "b", "c"])).toBe("c");
  });

  it("appendMetaboliteGeneration defaults to no model selected", () => {
    expect(
      appendMetaboliteGeneration([{ model: "phase1", query: "h" }], "CCO", undefined, {
        site: [1],
        headIndex: 0,
      }),
    ).toEqual([
      { model: "phase1", query: "h", som: [1] },
      {
        model: "_",
        query: "CCO",
        headIndex: 0,
        matchIndex: null,
      },
    ]);
  });

  it("selectMetaboliteGeneration keeps the child model when replacing", () => {
    expect(
      selectMetaboliteGeneration(
        [
          { model: "phase1", query: "phenol", som: [1] },
          { model: "ugt", query: "Oc1cccc(O)c1", headIndex: 0 },
        ],
        0,
        "Oc1cc(O)cc(O)c1",
        { headIndex: 0, site: [2, 3], matchIndex: 0 },
      ),
    ).toEqual([
      { model: "phase1", query: "phenol", som: [2, 3] },
      {
        model: "ugt",
        query: "Oc1cc(O)cc(O)c1",
        headIndex: 0,
        matchIndex: 0,
        som: undefined,
        bondIdx: null,
      },
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
  });

  it("encodes a readable head slug when possible", () => {
    expect(encodeHeadParam(1, results)).toBe("hydrolysis");
  });
});

describe("hopRouteId", () => {
  it("nests Remix route ids per hop depth", () => {
    expect(hopRouteId(0)).toBe("routes/_model.$model.$query");
    expect(hopRouteId(1)).toBe("routes/_model.$model.$query.$met1.$m1.$q1");
  });
});
