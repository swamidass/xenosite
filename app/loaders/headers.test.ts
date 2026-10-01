import { describe, expect, it } from "vitest";
import HEADERS, {
  DOCUMENT_CACHE_CONTROL,
  PREDICTION_CACHE_CONTROL,
  predictionHeaders,
} from "~/loaders/headers";

describe("loader cache headers", () => {
  it("uses hyphenated max-age (not maxage)", () => {
    expect(PREDICTION_CACHE_CONTROL).toMatch(/max-age=\d+/);
    expect(PREDICTION_CACHE_CONTROL).not.toMatch(/(?:^|[^-\w])maxage=/);
    expect(PREDICTION_CACHE_CONTROL).toMatch(/s-maxage=\d+/);
    expect(HEADERS["Cache-Control"]).toBe(PREDICTION_CACHE_CONTROL);
    expect(DOCUMENT_CACHE_CONTROL).toMatch(/max-age=\d+/);
  });

  it("lifts loader Cache-Control for document responses", () => {
    const loaderHeaders = new Headers({
      "Cache-Control": PREDICTION_CACHE_CONTROL,
    });
    const parentHeaders = new Headers();
    expect(
      predictionHeaders({
        loaderHeaders,
        parentHeaders,
        actionHeaders: new Headers(),
        errorHeaders: undefined,
      })["Cache-Control"],
    ).toBe(PREDICTION_CACHE_CONTROL);
  });
});
