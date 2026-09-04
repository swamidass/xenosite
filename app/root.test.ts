import { describe, expect, it } from "vitest";
import type { LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "@remix-run/node";
import HEADERS from "~/loaders/headers";
import { headers, links, loader, meta, shouldRevalidate } from "~/root";

describe("root headers / links / meta", () => {
  it("reuses the shared cache headers and emits icons", () => {
    expect(
      headers({} as Parameters<typeof headers>[0]),
    ).toEqual(HEADERS);
    const rels = links().map((l) => l.rel);
    expect(rels).toContain("stylesheet");
    expect(rels).toContain("icon");
  });

  it("sets charset and viewport", () => {
    expect(meta({} as Parameters<typeof meta>[0])).toEqual([
      { charSet: "utf-8" },
      { viewport: "width=device-width,initial-scale=1" },
    ]);
  });
});

describe("root loader", () => {
  it("returns GA config when there is no search redirect", async () => {
    const res = await loader({
      request: new Request("http://localhost/"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);
    expect((res as Response).status).toBe(200);
  });

  it("redirects search-box queries onto a molecule path", async () => {
    await expect(
      loader({
        request: new Request("http://localhost/?search=aspirin&model=phase1"),
        params: {},
        context: {},
      } as LoaderFunctionArgs),
    ).rejects.toMatchObject({ status: 302 });
  });
});

describe("root shouldRevalidate", () => {
  const args = (
    extra: Partial<ShouldRevalidateFunctionArgs>,
  ): ShouldRevalidateFunctionArgs =>
    ({
      currentUrl: new URL("http://localhost/phase1/aspirin"),
      nextUrl: new URL("http://localhost/phase1/aspirin"),
      formMethod: "GET",
      defaultShouldRevalidate: true,
      currentParams: {},
      nextParams: {},
      actionResult: undefined,
      actionStatus: undefined,
      currentDefaultLoader: false,
      nextDefaultLoader: false,
      ...extra,
    }) as ShouldRevalidateFunctionArgs;

  it("skips refetch on nested hops of the same root molecule", () => {
    expect(
      shouldRevalidate(
        args({
          nextUrl: new URL(
            "http://localhost/phase1/aspirin/" + encodeURIComponent("CCO;0"),
          ),
        }),
      ),
    ).toBe(false);
  });

  it("uses the default when the root molecule changes", () => {
    expect(
      shouldRevalidate(
        args({
          nextUrl: new URL("http://localhost/phase1/caffeine"),
        }),
      ),
    ).toBe(true);
  });

  it("defers to Remix for non-GET actions", () => {
    expect(
      shouldRevalidate(args({ formMethod: "POST", defaultShouldRevalidate: true })),
    ).toBe(true);
  });
});
