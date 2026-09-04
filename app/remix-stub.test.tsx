/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRemixStub } from "@remix-run/testing";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

vi.mock("~/loaders/backend.server", () => ({
  resolve_query: vi.fn(),
}));

import { resolve_query } from "~/loaders/backend.server";
import Home from "~/routes/_index";
import {
  default as Model,
  loader as modelLoader,
} from "~/routes/_model.$model";
import {
  default as MoleculeFocusRoot,
  loader as moleculeLoader,
} from "~/molecule-focus/root";
import MoleculeFocusIndex from "~/molecule-focus/index";
import {
  default as Met1,
  loader as met1Loader,
} from "~/molecule-focus/metaboliteRoute1";
import {
  default as Hop1,
  loader as hop1Loader,
} from "~/molecule-focus/hopRoute1";

const mockedResolve = vi.mocked(resolve_query);

const DEPICTION = `<svg viewBox="0 0 10 10"><script type="application/json">{"coords":[[1,2],[3,4]],"scale":20}</script></svg>`;

const aspirinQuery = {
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

function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <p>{error.status} {error.statusText}</p>;
  }
  return <p>Something went wrong</p>;
}

function AppStub() {
  return createRemixStub([
    {
      path: "/",
      ErrorBoundary: RouteError,
      children: [
        { index: true, Component: Home },
        {
          path: ":model",
          Component: Model,
          loader: modelLoader,
          children: [
            {
              path: ":query",
              Component: MoleculeFocusRoot,
              loader: moleculeLoader,
              children: [
                { index: true, Component: MoleculeFocusIndex },
                {
                  path: ":met1",
                  Component: Met1,
                  loader: met1Loader,
                  children: [
                    {
                      path: ":m1/:q1",
                      Component: Hop1,
                      loader: hop1Loader,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
}

describe("Remix route stub", () => {
  beforeEach(() => {
    mockedResolve.mockReset();
    mockedResolve.mockImplementation(async ({ model, query }) => {
      if (String(query).startsWith("aspirin")) {
        return { model, resolved_query: aspirinQuery };
      }
      return {
        model,
        resolved_query: {
          smiles: query,
          name: { name: "ethanol" },
          results: [],
        },
      };
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/depict")) {
          return {
            ok: true,
            status: 200,
            text: async () => "<svg></svg>",
          };
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the home catalog", async () => {
    const RemixStub = AppStub();
    render(<RemixStub initialEntries={["/"]} />);
    expect(await screen.findByText("What is XenoSite?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phase 1" })).toHaveAttribute(
      "href",
      "/phase1",
    );
  });

  it("404s an unknown model", async () => {
    const RemixStub = AppStub();
    render(<RemixStub initialEntries={["/not-a-model"]} />);
    expect(await screen.findByText("404 Not Found")).toBeInTheDocument();
  });

  it("renders a molecule prediction from the real nested routes", async () => {
    const RemixStub = AppStub();
    render(<RemixStub initialEntries={["/phase1/aspirin"]} />);
    expect(
      await screen.findByAltText("Aspirin Phase 1 prediction"),
    ).toBeInTheDocument();
    expect(await screen.findByText("hydrolysis")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Probability scale from 0.0 to 1.0" }),
    ).toBeInTheDocument();
  });

  it("follows a metabolite hop through Remix navigation", async () => {
    const user = userEvent.setup();
    const RemixStub = AppStub();
    render(<RemixStub initialEntries={["/phase1/aspirin"]} />);
    await user.click(await screen.findByRole("link", { name: /hydrolysis/i }));

    expect(await screen.findByText("Ethanol")).toBeInTheDocument();
    expect(mockedResolve).toHaveBeenCalledWith({
      model: "_",
      query: "CCO",
    });
  });

  it("renders a predicting nested hop", async () => {
    const RemixStub = AppStub();
    render(
      <RemixStub
        initialEntries={[
          "/phase1/" +
            encodeURIComponent("aspirin;0") +
            "/" +
            encodeURIComponent("CCO;0") +
            "/ugt/CCO",
        ]}
      />,
    );
    expect(await screen.findByText("Ethanol")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "UGT Conjugation" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
