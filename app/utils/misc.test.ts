import { describe, expect, it, vi } from "vitest";
import {
  capitalize,
  chooseRandom,
  classNames,
  commonMetaValues,
  getQueryUrl,
  isMetaLeaf,
  isSitemapSlug,
  moleculePath,
  replaceUnderscores,
  sendGoogleAnalyticsEvent,
  sendGoogleAnalyticsPageView,
  SITE_ORIGIN,
  siteUrl,
} from "~/utils";

describe("string helpers", () => {
  it("capitalizes and replaces underscores", () => {
    expect(capitalize("HELLO")).toBe("Hello");
    expect(replaceUnderscores("foo_bar")).toBe("foo bar");
    expect(replaceUnderscores("plain")).toBe("plain");
  });

  it("joins truthy class names", () => {
    expect(classNames("a", false, null, "b")).toBe("a b");
  });
});

describe("site URLs and slugs", () => {
  it("builds origin URLs", () => {
    expect(siteUrl()).toBe(SITE_ORIGIN);
    expect(siteUrl("/")).toBe(SITE_ORIGIN);
    expect(siteUrl("phase1/aspirin")).toBe(`${SITE_ORIGIN}/phase1/aspirin`);
    expect(siteUrl("/phase1")).toBe(`${SITE_ORIGIN}/phase1`);
  });

  it("rejects systematic CHEBI-like names as sitemap slugs", () => {
    expect(isSitemapSlug("aspirin")).toBe(true);
    expect(isSitemapSlug("")).toBe(false);
    expect(isSitemapSlug("ab")).toBe(false);
    expect(isSitemapSlug("1aspirin")).toBe(false);
    expect(isSitemapSlug("asp2rin")).toBe(false);
    expect(isSitemapSlug("foo(bar)")).toBe(false);
    expect(isSitemapSlug("foo,bar")).toBe(false);
  });

  it("uses a drug-like preferred name in the molecule path", () => {
    expect(moleculePath("phase1", "CC", "aspirin")).toBe("/phase1/aspirin");
    expect(moleculePath("phase1", "CC", "1,2-diol")).toBe("/phase1/CC");
  });
});

describe("commonMetaValues / isMetaLeaf", () => {
  it("fills title, canonical, and social tags", () => {
    const tags = commonMetaValues({
      title: "T",
      path: "/phase1",
      description: "D",
    });
    expect(tags.some((t) => "title" in t && t.title === "T")).toBe(true);
    expect(
      tags.some((t) => t.rel === "canonical" && t.href === `${SITE_ORIGIN}/phase1`),
    ).toBe(true);
  });

  it("detects the leaf match", () => {
    expect(
      isMetaLeaf([{ id: "root" }, { id: "routes/_model.$model" }], "routes/_model.$model"),
    ).toBe(true);
    expect(isMetaLeaf([{ id: "root" }], "routes/_model.$model")).toBe(false);
  });

  it("picks an element from a non-empty array", () => {
    expect(["a", "b", "c"]).toContain(chooseRandom(["a", "b", "c"]));
  });
});

describe("getQueryUrl", () => {
  it("routes empty queries to the model or home", () => {
    expect(getQueryUrl({ model: "_", query: null })).toBe("/");
    expect(getQueryUrl({ model: "", query: "" })).toBe("/");
    expect(getQueryUrl({ model: "phase1", query: null })).toBe("/phase1");
  });

  it("encodes a molecule query under the model", () => {
    expect(getQueryUrl({ model: "phase1", query: "a b" })).toBe(
      "/phase1/" + encodeURIComponent("a b"),
    );
    expect(getQueryUrl({ model: "", query: "CCO" })).toBe("/_/CCO");
  });
});

describe("Google Analytics helpers", () => {
  it("warns when gtag is missing and forwards when present", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("window", {});
    sendGoogleAnalyticsPageView("/x", "G-1");
    sendGoogleAnalyticsEvent("click", "ui", "btn", 2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    sendGoogleAnalyticsPageView("/x", "G-1");
    sendGoogleAnalyticsEvent("click", "ui", "btn", 2);
    expect(gtag).toHaveBeenCalledWith("config", "G-1", { page_path: "/x" });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "click",
      expect.objectContaining({
        event_category: "ui",
        event_label: "btn",
        value: 2,
      }),
    );
    vi.unstubAllGlobals();
  });
});
