import { describe, expect, it } from "vitest";
import type { LoaderFunctionArgs, MetaArgs } from "@remix-run/node";
import { loader, meta, shouldRevalidate } from "~/routes/_model.$model";
import { meta as indexMeta } from "~/routes/_index";
import { SITE_NAME } from "~/utils";

function args(params: Record<string, string>): LoaderFunctionArgs {
  return {
    params,
    request: new Request("http://localhost/"),
    context: {},
  };
}

describe("model layout loader / revalidate", () => {
  it("loads a known model and the all-models sentinel", async () => {
    expect(await (await loader(args({ model: "phase1" }))).json()).toEqual({});
    expect(await (await loader(args({ model: "_" }))).json()).toEqual({});
  });

  it("404s an unknown model", async () => {
    await expect(loader(args({ model: "not-a-model" }))).rejects.toMatchObject({
      status: 404,
    });
  });

  it("revalidates only when the root model changes", () => {
    expect(
      shouldRevalidate({
        currentParams: { model: "phase1" },
        nextParams: { model: "phase1", query: "aspirin" },
      } as Parameters<typeof shouldRevalidate>[0]),
    ).toBe(false);
    expect(
      shouldRevalidate({
        currentParams: { model: "phase1" },
        nextParams: { model: "ugt" },
      } as Parameters<typeof shouldRevalidate>[0]),
    ).toBe(true);
  });
});

describe("model and index meta", () => {
  it("returns leaf tags for a model page", () => {
    const tags = meta({
      matches: [{ id: "routes/_model.$model" }],
      params: { model: "phase1" },
    } as MetaArgs);
    expect(tags.some((t) => "title" in t && String(t.title).includes(SITE_NAME))).toBe(
      true,
    );
    expect(tags.some((t) => "script:ld+json" in t)).toBe(true);
  });

  it("uses the all-models description for _", () => {
    const tags = meta({
      matches: [{ id: "routes/_model.$model" }],
      params: { model: "_" },
    } as MetaArgs);
    const desc = tags.find((t) => t.name === "description");
    expect(desc?.content).toMatch(/liver enzymes/);
  });

  it("skips meta when a nested route is the leaf", () => {
    expect(
      meta({
        matches: [
          { id: "routes/_model.$model" },
          { id: "routes/_model.$model.$query" },
        ],
        params: { model: "phase1" },
      } as MetaArgs),
    ).toEqual([]);
  });

  it("emits home-page meta and JSON-LD", () => {
    const tags = indexMeta({} as MetaArgs);
    expect(tags.some((t) => "title" in t)).toBe(true);
    expect(tags.some((t) => "script:ld+json" in t)).toBe(true);
  });
});
