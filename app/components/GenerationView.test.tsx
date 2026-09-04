import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GenerationView, MoleculeFocusRootLayout } from "~/components/MoleculeFocus";
import MoleculeFocus from "~/components/MoleculeFocus";
import MetabolitePanel from "~/components/MetabolitePanel";
import Gtag from "~/components/Gtag";
import Loading from "~/components/Loading";
import { ModelTabs } from "~/components/ModelTabs";
import ModelDescriptions from "~/components/ModelDescriptions";

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    preventScrollReset: _p,
    reloadDocument: _r,
    prefetch: _f,
    ...rest
  }: {
    to: string;
    children?: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "#"} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/phase1/aspirin", search: "" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useOutletContext: () => ({ formationForChild: null }),
  useNavigation: () => ({ state: "idle", location: undefined }),
  useParams: () => ({ model: "phase1", query: "aspirin" }),
  useLoaderData: () => ({ gaTrackingId: "G-TEST" }),
  useMatches: () => [],
}));

const DEPICTION = `<svg viewBox="0 0 10 10"><script type="application/json">{"coords":[[1,2],[3,4]],"scale":20}</script></svg>`;

const resolved = {
  smiles: "CC(=O)Oc1ccccc1C(=O)O",
  name: { name: "aspirin", description: "pain reliever" },
  results: [
    {
      model: "phase1.hydrolysis",
      depiction: DEPICTION,
      metabolite: [
        { smiles: "CCO", atom: [0], score: 0.9, pathway: "Hydrolysis" },
      ],
    },
  ],
  bonds: { idx: [[0, 1]] },
};

describe("GenerationView", () => {
  it("returns null without resolved query and shows API errors", () => {
    expect(
      renderToStaticMarkup(
        <GenerationView
          depth={0}
          resolved_query={null}
          model="phase1"
          generations={[{ model: "phase1", query: "aspirin" }]}
          nestOutlet={false}
        />,
      ),
    ).toBe("");
    expect(
      renderToStaticMarkup(
        <GenerationView
          depth={0}
          resolved_query={{ detail: "backend down" }}
          model="phase1"
          generations={[{ model: "phase1", query: "aspirin" }]}
          nestOutlet={false}
        />,
      ),
    ).toContain("backend down");
  });

  it("renders a generation-0 prediction with scale bar and metabolites", () => {
    const html = renderToStaticMarkup(
      <GenerationView
        depth={0}
        resolved_query={resolved}
        model="phase1"
        generations={[{ model: "phase1", query: "aspirin" }]}
        showPanel
        identityInShell
        nestOutlet={false}
      />,
    );
    expect(html).toContain("hydrolysis");
    expect(html).toContain("data:image/svg+xml");
    expect(html).toContain("Metabolites");
  });

  it("renders nested identity and a plain structure when the model is unselected", () => {
    const html = renderToStaticMarkup(
      <GenerationView
        depth={1}
        resolved_query={{ smiles: "CCO", name: { name: "ethanol" } }}
        model="_"
        generations={[
          { model: "phase1", query: "aspirin" },
          { model: "_", query: "CCO" },
        ]}
        formationMeta={{ pathway: "Hydrolysis", score: 0.42 }}
        nestOutlet={false}
      />,
    );
    expect(html).toContain("Ethanol");
    expect(html).toContain("hydrolysis");
    expect(html).toContain("0.42");
    expect(html).toContain("animate-pulse");
  });
});

describe("MoleculeFocus layouts", () => {
  it("wraps the root generation and ignores an empty deprecated chain", () => {
    const root = renderToStaticMarkup(
      <MoleculeFocusRootLayout
        resolved_query={resolved}
        model="phase1"
        query="aspirin"
      />,
    );
    expect(root).toContain("hydrolysis");
    expect(
      renderToStaticMarkup(
        <MoleculeFocus chain={[]} model="phase1" segments={["aspirin"]} />,
      ),
    ).toBe("");
  });
});

describe("MetabolitePanel / chrome", () => {
  it("hides when there is nothing to show", () => {
    expect(
      renderToStaticMarkup(
        <MetabolitePanel metabolites={[]} hrefForMetabolite={() => "/x"} />,
      ),
    ).toBe("");
  });

  it("lists ranked metabolites", () => {
    const html = renderToStaticMarkup(
      <MetabolitePanel
        metabolites={[
          { smiles: "CCO", atom: [0], score: 0.9, pathway: "Hydrolysis" },
        ]}
        hrefForMetabolite={(m) => `/next/${m.smiles}`}
      />,
    );
    expect(html).toContain("Metabolites");
    expect(html).toContain("/next/CCO");
  });
});

describe("shell widgets", () => {
  it("renders model tabs, descriptions, loading, and gtag", () => {
    const tabs = renderToStaticMarkup(
      <ModelTabs
        depth={0}
        generations={[{ model: "phase1", query: "aspirin" }]}
      />,
    );
    expect(tabs).toContain("Phase 1");
    expect(renderToStaticMarkup(<ModelDescriptions />)).toContain("What is XenoSite?");
    expect(renderToStaticMarkup(<Loading />)).toContain("progressbar");
    expect(renderToStaticMarkup(<Gtag />)).toContain("googletagmanager");
  });
});
