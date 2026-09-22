import { describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "@remix-run/node";

vi.hoisted(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(8),
    })),
  );
});

vi.mock("satori", () => ({
  default: vi.fn(async () => "<svg/>"),
}));

vi.mock("svg2img", () => ({
  default: (
    _svg: string,
    _opts: unknown,
    cb: (err: Error | null, buf: Buffer) => void,
  ) => cb(null, Buffer.from("png")),
}));

vi.mock("~/loaders/backend.server", () => ({
  resolve_query: vi.fn(),
}));

vi.mock("~/utils/xpictPaint.server", () => ({
  paintSmilesServer: vi.fn(async () => "<svg id='mol-server'/>"),
}));

import satori from "satori";
import { resolve_query } from "~/loaders/backend.server";
import { paintSmilesServer } from "~/utils/xpictPaint.server";
import { loader } from "~/routes/og.$model.$query";

const mockedResolve = vi.mocked(resolve_query);
const mockedSatori = vi.mocked(satori);
const mockedPaint = vi.mocked(paintSmilesServer);

describe("og image loader", () => {
  it("renders an Open Graph PNG from server-side xpict paint", async () => {
    mockedResolve.mockResolvedValue({
      model: "phase1",
      resolved_query: {
        smiles: "CCO",
        name: { name: "ethanol" },
        results: [
          {
            model: "phase1.hydrolysis",
            atom: [0.1, 0.5, 0.9],
            bond: [0.2],
          },
        ],
      },
    });
    const res = await loader({
      params: { model: "phase1", query: "ethanol" },
      request: new Request("http://localhost/og/phase1/ethanol"),
      context: {},
    } as LoaderFunctionArgs);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("png");
    expect(mockedPaint).toHaveBeenCalledWith(
      "CCO",
      expect.objectContaining({
        atomScores: [0.1, 0.5, 0.9],
        bondScores: [0.2],
      }),
    );
    expect(mockedSatori).toHaveBeenCalled();
  });

  it("falls back to XDot when molecule info cannot be built", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedResolve.mockResolvedValue({
      model: "nope",
      resolved_query: { smiles: "CCO", results: [] },
    });
    const res = await loader({
      params: { model: "nope", query: "CCO" },
      request: new Request("http://localhost/og/nope/CCO"),
      context: {},
    } as LoaderFunctionArgs);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    err.mockRestore();
  });
});
