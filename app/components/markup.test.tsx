import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutModel from "~/components/AboutModel";
import CopyJsonButton from "~/components/CopyJsonButton";
import CopyableSmiles from "~/components/CopyableSmiles";
import GenerationBanner from "~/components/GenerationBanner";
import GenerationMarker from "~/components/GenerationMarker";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import MetabolitePathNav from "~/components/MetabolitePathNav";
import MoleculeIdentity from "~/components/MoleculeIdentity";
import MoleculeSummary from "~/components/MoleculeSummary";
import OpenGraphImage from "~/components/OpenGraphImage";
import PlotDot from "~/components/PlotDot";
import PlotDotScaleBar from "~/components/PlotDotScaleBar";
import Spinner from "~/components/Spinner";
import XDot from "~/components/XDot";

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children?: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe("presentational components", () => {
  it("renders PlotDot, the scale bar, XDot, and Spinner", () => {
    const dot = renderToStaticMarkup(<PlotDot value={0.75} title="score" />);
    expect(dot).toContain("role=\"img\"");
    expect(dot).toContain("<circle");
    const bar = renderToStaticMarkup(<PlotDotScaleBar size={24} />);
    expect(bar).toContain("data:image/svg+xml");
    expect(bar).toContain("Probability scale");
    expect(renderToStaticMarkup(<XDot className="w-8" />)).toContain("<circle");
    expect(renderToStaticMarkup(<Spinner />)).toContain("animate-ping");
  });

  it("renders generation chrome", () => {
    expect(renderToStaticMarkup(<GenerationBanner depth={0} />)).toContain(
      "Generation 1",
    );
    expect(
      renderToStaticMarkup(<GenerationMarker depth={0} label="aspirin" />),
    ).toContain("aspirin");
  });

  it("renders identity, copy controls, and summaries", () => {
    expect(renderToStaticMarkup(<CopyableSmiles smiles="" />)).toBe("");
    expect(renderToStaticMarkup(<CopyableSmiles smiles="CCO" />)).toContain(
      "CCO",
    );
    expect(renderToStaticMarkup(<CopyJsonButton value={{ a: 1 }} />)).toContain(
      "Copy JSON",
    );
    expect(renderToStaticMarkup(<MoleculeIdentity resolved_query={null} />)).toBe(
      "",
    );
    const id = renderToStaticMarkup(
      <MoleculeIdentity
        resolved_query={{
          smiles: "CCO",
          name: {
            name: "ethanol",
            description: "alcohol",
            chebi: 16236,
            chebiUrl: "https://example.test/chebi",
          },
        }}
      />,
    );
    expect(id).toContain("Ethanol");
    expect(id).toContain("CHEBI");
    expect(
      renderToStaticMarkup(
        <MoleculeSummary
          resolved_query={{ detail: "not found" }}
          model="phase1"
        />,
      ),
    ).toContain("not found");
    const summary = renderToStaticMarkup(
      <MoleculeSummary
        model="phase1"
        resolved_query={{
          smiles: "CCO",
          name: { name: "ethanol", description: "alcohol", chebi: "1", chebiUrl: "https://x" },
          results: [
            { model: "phase1.hydrolysis", depiction: "<svg/>" },
            { model: "phase1.reduction", depiction: "<svg/>" },
          ],
        }}
      />,
    );
    expect(summary).toContain("Ethanol");
    expect(summary).toContain("hydrolysis");
  });

  it("skips the path nav until there are two crumbs", () => {
    expect(
      renderToStaticMarkup(
        <MetabolitePathNav crumbs={[{ depth: 0, label: "Substrate", current: true }]} />,
      ),
    ).toBe("");
    const nav = renderToStaticMarkup(
      <MetabolitePathNav
        crumbs={[
          { depth: 0, label: "Substrate", href: "/phase1/a", current: false, title: "a" },
          { depth: 1, label: "Generation 1", current: true, title: "b" },
        ]}
      />,
    );
    expect(nav).toContain("Metabolite path");
    expect(nav).toContain("/phase1/a");
  });

  it("renders AboutModel, OG image, and the depict placeholder", () => {
    expect(renderToStaticMarkup(<AboutModel model="_" />)).toBe("");
    expect(renderToStaticMarkup(<AboutModel model="missing" />)).toBe("");
    expect(renderToStaticMarkup(<AboutModel model="phase1" />)).toContain(
      "About this model",
    );
    expect(
      renderToStaticMarkup(
        <OpenGraphImage name="aspirin" model="Phase 1" depiction="<svg/>" />,
      ),
    ).toContain("XenoSite - Phase 1");
    expect(
      renderToStaticMarkup(
        <LazyMetaboliteImg smiles="CCO" alt="ethanol" />,
      ),
    ).toContain("animate-pulse");
  });
});
