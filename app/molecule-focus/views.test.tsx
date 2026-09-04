import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createHopRoute, createMetaboliteRoute } from "~/molecule-focus/hop";
import Model from "~/routes/_model.$model";
import Home from "~/routes/_index";

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
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  useLoaderData: () => ({
    depth: 1,
    model: "ugt",
    query: "CCO",
    resolved_query: {
      smiles: "CCO",
      name: { name: "ethanol" },
      results: [],
    },
  }),
  useParams: () => ({
    model: "phase1",
    query: "aspirin",
    met1: "CCO;0",
    m1: "ugt",
    q1: "CCO",
  }),
  useMatches: () => [
    {
      id: "routes/_model.$model.$query",
      params: { model: "phase1", query: "aspirin" },
    },
  ],
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/phase1/aspirin/CCO/ugt/CCO", search: "" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useOutletContext: () => ({ formationForChild: { pathway: "Hydrolysis", score: 0.5 } }),
  useNavigation: () => ({ state: "idle" }),
}));

describe("hop route views", () => {
  it("renders a predicting hop and passthrough metabolite layout", () => {
    const Hop = createHopRoute(1).default;
    expect(renderToStaticMarkup(<Hop />)).toContain("Ethanol");

    const Met = createMetaboliteRoute(1).default;
    expect(renderToStaticMarkup(<Met />)).toContain("data-testid=\"outlet\"");
  });
});

describe("model / home route views", () => {
  it("hosts an outlet when a molecule is present", () => {
    expect(renderToStaticMarkup(<Model />)).toContain("data-testid=\"outlet\"");
  });

  it("renders the home model catalog", () => {
    expect(renderToStaticMarkup(<Home />)).toContain("What is XenoSite?");
  });
});
