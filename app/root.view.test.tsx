import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App, { ErrorBoundary } from "~/root";

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    preventScrollReset: _p,
    reloadDocument: _r,
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
  Links: () => null,
  Meta: () => null,
  Scripts: () => null,
  ScrollRestoration: () => null,
  LiveReload: () => null,
  Outlet: () => <div data-testid="outlet" />,
  isRouteErrorResponse: (e: { status?: number }) => e?.status === 404,
  useRouteError: () => ({ status: 404 }),
  useFetcher: () => ({
    Form: ({
      children,
      ...rest
    }: {
      children?: React.ReactNode;
      [k: string]: unknown;
    }) => <form {...rest}>{children}</form>,
  }),
  useMatches: () => [
    {
      id: "routes/_model.$model.$query",
      pathname: "/phase1/aspirin",
      params: { model: "phase1", query: "aspirin" },
      data: { resolved_query: { smiles: "CCO", name: { name: "aspirin" } } },
    },
  ],
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/phase1/aspirin", search: "" }),
  useParams: () => ({ model: "phase1", query: "aspirin" }),
  useLoaderData: () => ({ gaTrackingId: null }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useOutletContext: () => ({}),
  useNavigation: () => ({ state: "idle", location: undefined }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigation: () => ({ state: "idle", location: undefined }),
  };
});

describe("root App / ErrorBoundary", () => {
  it("renders the shell with a molecule identity slot", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("XenoSite");
    expect(html).toContain("Aspirin");
    expect(html).toContain("data-testid=\"outlet\"");
  });

  it("renders a 404 error page with model links", () => {
    const html = renderToStaticMarkup(<ErrorBoundary />);
    expect(html).toContain("Page not found");
    expect(html).toContain("/phase1");
  });
});
