
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
  useFetcher, 
  useMatches, 
  useNavigate
} from "@remix-run/react";
import { useNavigation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ModelTabs, Spinner } from "~/components";
import HEADERS from "~/loaders/headers";
import { commonMetaValues, getQueryUrl } from "~/utils";
import { XDot, Gtag } from "~/components";
import { getLdJson } from "./loaders/ld-json";


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
  { rel: "icon", type: "image/png", href: "./favicon.png" },
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

export const meta: MetaFunction = () => {
  const results = commonMetaValues();
  
  // add ld+json
  const ldJson = getLdJson()
  if (ldJson.length > 0) {
    results.push({
      "script:ld+json": ldJson  // @ts-ignore
    });
  }

  return results;
}

export default function App() {
  const fetcher = useFetcher();
  const matches = useMatches();
  const query = matches[matches.length - 1].params?.query;
  const model = matches[matches.length - 1].params?.model || (query ? "_" : "");
  const navigate = useNavigate();
  const transition = useNavigation();
  const message = "";
  const [new_query, setNewQuery] = useState<string | null>(query || '');

  useEffect(() => {
      if (new_query === query) return;

      const debounced = setTimeout(() => {
          navigate(getQueryUrl({model, query: new_query}));
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
          <h1 className="text-4xl inline font-bold pr-3 relative">
            <div className="inset-0 absolute -top-2 -z-10">
              <XDot className="w-[4em] m-auto opacity-25" />
            </div>
            <Link to=".." reloadDocument>XenoSite</Link>
          </h1>
          <>
              {/* Search Input */}
              <fetcher.Form
                  method="GET"
                  className="mt-10 pt-10 block w-full "
                  onChange={(e) => {
                      const query = (e.target as HTMLInputElement).value;
                      setNewQuery(query);
                  }}
              >
                  <input
                      type="text"
                      className="placeholder:text-red-400 placeholder:text-sm text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
                      name="search"
                      placeholder="Type in a molecule name or SMILES string."
                      defaultValue={query}
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

              {/* Search Error Message */}
              <div className="h-8 text-center  py-3">
                  {message ? <div className="text-red-400 text-sm">{message}</div> : null}
              </div>

              {/* Search Model Filter & Results */}
              <ModelTabs>
                  {transition.state != "idle" && new_query ? 
                      <Spinner /> :
                      <Outlet />
                  }
              </ModelTabs>
          </>
        </div> 

        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : <Gtag />}
      </body>
    </html>
  );
}
