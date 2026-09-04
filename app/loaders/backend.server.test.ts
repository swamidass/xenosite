import { afterEach, describe, expect, it, vi } from "vitest";
import {
  backend_api,
  backendQueryParams,
  resolve_query,
} from "~/loaders/backend.server";

describe("backendQueryParams", () => {
  it("requests depictions and metabolites for the site panel", () => {
    const p = backendQueryParams("aspirin");
    expect(p.get("query")).toBe("aspirin");
    expect(p.get("depict")).toBe("true");
    expect(p.get("metabolites")).toBe("true");
    expect(p.get("detailed")).toBe("true");
  });
});

describe("backend_api / resolve_query", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns {} when smiles is empty", async () => {
    expect(await backend_api(null, "/v0/phase1")).toEqual({});
    expect(await backend_api("", "/v0/phase1")).toEqual({});
  });

  it("attaches Chebi URLs on the molecule and metabolites", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          name: { chebi: 15365, name: "aspirin" },
          results: [
            {
              metabolite: [
                { smiles: "CCO", name: { chebi: 1 } },
                { smiles: "CC", name: { chebi: 2, chebiUrl: "already" } },
              ],
            },
          ],
        }),
      }),
    );
    const { resolved_query, model } = await resolve_query({
      model: "phase1",
      query: "aspirin",
    });
    expect(model).toBe("phase1");
    expect(resolved_query.name.chebiUrl).toContain("CHEBI:15365");
    expect(resolved_query.results[0].metabolite[0].name.chebiUrl).toContain(
      "CHEBI:1",
    );
    expect(resolved_query.results[0].metabolite[1].name.chebiUrl).toBe(
      "already",
    );
  });

  it("uses canonize for all-models and treats JSON failure as empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error("bad json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const { resolved_query, model } = await resolve_query({
      model: "_",
      query: "CCO",
    });
    expect(model).toBe("_");
    expect(resolved_query).toEqual({});
    expect(String(fetchMock.mock.calls[0]![0])).toContain("/v1/canonize");
  });
});
