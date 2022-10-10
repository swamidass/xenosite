import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  Link,
  useLoaderData,
  useLocation,
  json,
} from "remix";

import { Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, ArrowLongLeftIcon } from "@heroicons/react/20/solid";
import { MODELS } from "~/data";
import XDot from "~/components/XDot";

import * as gtag from "~/gtags.client";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

import styles from "./styles/app.css";

export function meta() {
  return {
    charset: "utf-8",
    title: "XenoSite",
    viewport: "width=device-width,initial-scale=1",
  };
}

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    { rel: "icon", type: "image/png", href: "/favicon.png" },
  ];
}

export const loader = async () => {
  return json({ gaTrackingId: process.env.GA_TRACKING_ID });
};

function Gtag({ gaTrackingId }) {
  return process.env.NODE_ENV === "development" || !gaTrackingId ? null : (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
      />
      <script
        async
        id="gtag-init"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaTrackingId}', {
            page_path: window.location.pathname,
          });
        `,
        }}
      />
    </>
  );
}

export default function App() {
  const matches = useMatches();
  const location = useLocation();

  const { gaTrackingId } = useLoaderData();
  const model = matches[0].params?.model;
  const smiles = matches[0].params?.smiles;

  useEffect(() => {
    if (gaTrackingId?.length) {
      gtag.pageview(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  const modelinfo = MODELS.find((x) => x.path == model);

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
            <Link to="/">XenoSite</Link>
          </h1>
          <Menu
            as="div"
            className="relative inline-block align-bottom w-50 text-left"
          >
            <div className="w-50">
              <Menu.Button className="inline-flex w-50 text-left rounded-md border border-gray-300 bg-white px-4 py-2  font-medium shadow-sm hover:bg-gray-50 focus:outline-none ">
                {modelinfo?.model}
                <ChevronDownIcon
                  className="-mr-1 ml-auto h-5 w-5"
                  aria-hidden="true"
                />
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {MODELS.map((x, i) => (
                    <Menu.Item key={i}>
                      {({ active }) => (
                        <Link
                          to={`/${x.path}${
                            smiles ? "/_/" + encodeURIComponent(smiles) : ""
                          }`}
                          className={classNames(
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700",
                            "block px-4 py-2 text-sm"
                          )}
                        >
                          {x.model}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {model ? null : (
            <div className="inline-block whitespace-nowrap px-3 align-bottom py-2 text-sm text-red-400">
              <ArrowLongLeftIcon
                className="mx-1 h-5 w-5 inline"
                aria-hidden="true"
              />
              select model.
            </div>
          )}
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />

        <Gtag gaTrackingId={gaTrackingId} />
        <LiveReload />
      </body>
    </html>
  );
}
