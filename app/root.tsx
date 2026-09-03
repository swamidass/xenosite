
import stylesheet from "~/styles/app.css";
import { redirect, json } from "@remix-run/node";
import type { HeadersFunction, LinksFunction, LoaderFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useFetcher,
  useMatches,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import { useNavigation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AboutModel, ModelTabs, Spinner, XDot, Gtag } from "~/components";
import HEADERS from "~/loaders/headers";
import { getQueryUrl } from "~/utils";
import { MODELS } from "~/data";
import {
  parseMoleculeFocusPath,
} from "~/utils/metabolitePath";


export const headers: HeadersFunction = ({
  actionHeaders,
  loaderHeaders,
  parentHeaders,
  errorHeaders,
}) => {
  return HEADERS;
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/png", href: "/favicon.png" },
];

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const query = new URL(request.url).searchParams;
  const search = query.get("search");
  const model = query.get("model");

  if (model || search) {
      const url = getQueryUrl({ model: model || "_", query: search || "" });
      throw redirect(url);
  }
  return json({ gaTrackingId: process.env.GA_TRACKING_ID });
};

export const meta: MetaFunction = () => [
  { charSet: "utf-8" },
  { viewport: "width=device-width,initial-scale=1" },
];

function SiteLogo() {
  return (
    <p className="text-4xl inline font-bold pr-3 relative">
      <span className="inset-0 absolute -top-2 -z-10">
        <XDot className="w-[4em] m-auto opacity-25" />
      </span>
      <Link to="/" reloadDocument>XenoSite</Link>
    </p>
  );
}

export default function App() {
  const fetcher = useFetcher();
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const parsed = parseMoleculeFocusPath(leaf?.pathname || "");
  // Search box always reflects the root molecule, not a nested metabolite.
  const query =
    parsed?.segments?.[0] ||
    leaf?.params?.query;
  const model =
    parsed?.model ||
    leaf?.params?.model ||
    (query ? "_" : "");
  const navigate = useNavigate();
  const transition = useNavigation();
  const message = "";
  const [new_query, setNewQuery] = useState<string | null>(query || "");

  useEffect(() => {
    setNewQuery(query || "");
  }, [query]);

  useEffect(() => {
    if (new_query === query) return;

    const debounced = setTimeout(() => {
      navigate(getQueryUrl({ model, query: new_query }));
    }, 300);
    return () => {
      clearTimeout(debounced);
    };
  }, [new_query, model, query, navigate]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="max-w-screen-xl mx-auto mt-10 xl:px-0 px-3">
          <SiteLogo />
          <>
            <fetcher.Form
              method="GET"
              className="mt-10 pt-10 block w-full "
              onChange={(e) => {
                const q = (e.target as HTMLInputElement).value;
                setNewQuery(q);
              }}
            >
              <input
                type="text"
                className="placeholder:text-red-400 placeholder:text-sm text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
                name="search"
                placeholder="Type in a molecule name or SMILES string."
                defaultValue={query}
                key={query || "empty"}
              />
              {model ? (
                <input
                  type="text"
                  className="hidden"
                  name="model"
                  defaultValue={model}
                />
              ) : null}
              <input className="hidden" type="submit" />
            </fetcher.Form>

            <div className="h-8 text-center py-3">
              {message ? (
                <div className="text-red-400 text-sm">{message}</div>
              ) : null}
            </div>

            {/* Primary model menu always sits directly under the search box. */}
            <ModelTabs segments={parsed?.segments} />
            {model && model !== "_" ? <AboutModel model={model} /> : null}

            {transition.state != "idle" && new_query ? (
              <Spinner />
            ) : (
              <Outlet />
            )}
          </>
        </div>

        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : <Gtag />}
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const heading = is404 ? "Page not found" : "Something went wrong";
  const message = is404
    ? "That page does not exist. Try a model below, or go back home."
    : "An unexpected error occurred.";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{`XenoSite | ${heading}`}</title>
        <Links />
      </head>
      <body>
        <div className="max-w-screen-xl mx-auto mt-10 xl:px-0 px-3">
          <SiteLogo />
          <div className="prose max-w-prose mx-auto py-16 text-center">
            <h1>{heading}</h1>
            <p>{message}</p>
            <p>
              <Link to="/">Home</Link>
            </p>
            <ul className="list-none p-0 flex flex-wrap justify-center gap-3">
              {MODELS.map((model) => (
                <li key={model.path}>
                  <Link to={`/${model.path}`}>{model.model}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
