import { afterEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { loader } from "~/routes/depict";

describe("depict loader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 without a query", async () => {
    const res = await loader({
      request: new Request("http://localhost/depict"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Missing query");
  });

  it("proxies an upstream depiction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: async () => "<svg/>",
        status: 200,
        headers: new Headers({ "Content-Type": "image/svg+xml" }),
      }),
    );
    const res = await loader({
      request: new Request("http://localhost/depict?query=CCO"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await res.text()).toBe("<svg/>");
  });
});
