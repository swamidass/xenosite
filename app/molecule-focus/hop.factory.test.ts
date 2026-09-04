import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "@remix-run/node";

vi.mock("~/loaders/backend.server", () => ({
  resolve_query: vi.fn(),
}));

import { resolve_query } from "~/loaders/backend.server";
import {
  createHopRoute,
  createMetaboliteRoute,
  shouldRevalidateHop,
} from "~/molecule-focus/hop";
import { UNSELECTED_MODEL_PATH } from "~/utils/metabolitePath";

const mockedResolve = vi.mocked(resolve_query);

function loaderArgs(
  params: Record<string, string | undefined>,
): LoaderFunctionArgs {
  return {
    params,
    request: new Request("http://localhost/"),
    context: {},
  };
}

describe("createMetaboliteRoute / createHopRoute", () => {
  beforeEach(() => {
    mockedResolve.mockReset();
    mockedResolve.mockResolvedValue({
      resolved_query: { smiles: "CCO" },
      model: UNSELECTED_MODEL_PATH,
    });
  });

  it("rejects depth 0 factories", () => {
    expect(() => createMetaboliteRoute(0)).toThrow(/depth >= 1/);
    expect(() => createHopRoute(0)).toThrow(/nested depth >= 1/);
  });

  it("passthrough-loads when a predicting child is mounted", async () => {
    const { loader, shouldRevalidate } = createMetaboliteRoute(1);
    const res = await loader(
      loaderArgs({ met1: "CCO;0", m1: "ugt", q1: "CCO" }),
    );
    expect(mockedResolve).not.toHaveBeenCalled();
    expect(await res.json()).toMatchObject({
      depth: 1,
      passthrough: true,
      query: "",
    });
    expect(
      shouldRevalidate({
        currentParams: { met1: "CCO" },
        nextParams: { met1: "CCO", m1: "ugt", q1: "CCO" },
      }),
    ).toBe(false);
    expect(
      shouldRevalidate({
        currentParams: { met1: "CCO", m1: "ugt", q1: "CCO" },
        nextParams: { met1: "CCC" },
      }),
    ).toBe(false);
    expect(
      shouldRevalidate({
        currentParams: { met1: "CCO" },
        nextParams: { met1: "CCC" },
      }),
    ).toBe(true);
  });

  it("canonizes the metabolite leaf when no child model is selected", async () => {
    const { loader } = createMetaboliteRoute(1);
    const res = await loader(loaderArgs({ met1: "CCO;0" }));
    expect(mockedResolve).toHaveBeenCalledWith({
      model: UNSELECTED_MODEL_PATH,
      query: "CCO",
    });
    expect(await res.json()).toMatchObject({
      depth: 1,
      query: "CCO",
      passthrough: false,
      resolved_query: { smiles: "CCO" },
    });
  });

  it("loads a predicting hop and revalidates via shouldRevalidateHop", async () => {
    mockedResolve.mockResolvedValue({
      resolved_query: { smiles: "CCO" },
      model: "ugt",
    });
    const { loader, shouldRevalidate } = createHopRoute(1);
    const res = await loader(
      loaderArgs({ m1: "ugt", q1: "CCO;1,2" }),
    );
    expect(mockedResolve).toHaveBeenCalledWith({
      model: "ugt",
      query: "CCO",
    });
    expect(await res.json()).toMatchObject({
      depth: 1,
      model: "ugt",
      query: "CCO",
    });
    const cur = { m1: "ugt", q1: "CCO", met1: "CCO;0" };
    expect(shouldRevalidate({ currentParams: cur, nextParams: cur })).toBe(
      false,
    );
    expect(
      shouldRevalidate({
        currentParams: cur,
        nextParams: { ...cur, m1: "phase1" },
      }),
    ).toBe(true);
  });
});

describe("shouldRevalidateHop metabolite key", () => {
  it("revalidates when this hop's metabolite slug changes", () => {
    const cur = { met1: "CCO;0", m1: "ugt", q1: "CCO" };
    expect(shouldRevalidateHop(1, cur, { ...cur, met1: "CCC;0" })).toBe(true);
  });
});
