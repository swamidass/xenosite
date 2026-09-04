import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs, MetaArgs } from "@remix-run/node";

vi.mock("~/loaders/backend.server", () => ({
  resolve_query: vi.fn(),
}));

import { resolve_query } from "~/loaders/backend.server";
import { loader, meta } from "~/molecule-focus/root";
import { SITE_NAME } from "~/utils";

const mockedResolve = vi.mocked(resolve_query);

describe("root molecule loader / meta", () => {
  beforeEach(() => {
    mockedResolve.mockReset();
    mockedResolve.mockResolvedValue({
      resolved_query: {
        smiles: "CC(=O)Oc1ccccc1C(=O)O",
        name: {
          name: "aspirin",
          description: "pain reliever",
          chebi: 15365,
          chebiUrl: "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:15365",
        },
        results: [{ model: "phase1.hydrolysis" }],
      },
      model: "phase1",
    });
  });

  it("predicts with SMILES only, stripping the mol-stub SOM", async () => {
    const res = await loader({
      params: { model: "phase1", query: "aspirin;1,2" },
      request: new Request("http://localhost/"),
      context: {},
    } as LoaderFunctionArgs);
    expect(mockedResolve).toHaveBeenCalledWith({
      model: "phase1",
      query: "aspirin",
    });
    expect(await res.json()).toMatchObject({
      model: "phase1",
      query: "aspirin",
    });
  });

  it("builds molecule-page meta and JSON-LD", () => {
    const tags = meta({
      params: { model: "phase1", query: "aspirin" },
      data: {
        model: "phase1",
        query: "aspirin",
        resolved_query: {
          smiles: "CC(=O)Oc1ccccc1C(=O)O",
          name: {
            name: "aspirin",
            description: "pain reliever",
            chebi: 15365,
            chebiUrl:
              "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:15365",
          },
          results: [{ model: "phase1.hydrolysis" }],
        },
      },
      location: { pathname: "/phase1/aspirin" },
      matches: [],
    } as unknown as MetaArgs);
    expect(
      tags.some(
        (t) => "title" in t && String(t.title).includes(`${SITE_NAME} | Phase1`),
      ),
    ).toBe(true);
    expect(tags.some((t) => "script:ld+json" in t)).toBe(true);
  });
});
