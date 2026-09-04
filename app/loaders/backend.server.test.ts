import { describe, expect, it } from "vitest";
import { backendQueryParams } from "~/loaders/backend.server";

describe("backendQueryParams", () => {
  it("requests depictions and metabolites for the site panel", () => {
    const p = backendQueryParams("aspirin");
    expect(p.get("query")).toBe("aspirin");
    expect(p.get("depict")).toBe("true");
    expect(p.get("metabolites")).toBe("true");
    expect(p.get("detailed")).toBe("true");
  });
});
