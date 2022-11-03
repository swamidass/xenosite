import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  json,
} from "remix";

import XDot from "~/components/XDot";

import styles from "./styles/app.css";
import { Gtag } from "~/components/Gtag";
import { ModelMenu } from "~/components/ModelMenu";

// import GlobalLoading from "~/components/GlobalLoading";

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export function meta({ location }) {
  const description =
    "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes";
  return {
    charset: "utf-8",
    viewport: "width=device-width,initial-scale=1",
    title: "XenoSite",
    description: description,
    "og:title": "XenoSite",
    "og:type": "website",
    "og:url": "https://xenosite.org" + location.pathname,
    "og:description": description,
    "og:image": "https://xenosite.org/xenosite.png",
    "twitter:title": "XenoSite",
    "twitter:description": description,
    "twitter:url": "https://xenosite.org" + location.pathname,
    "twitter:image": "https://xenosite.org/xenosite.png",
    "twitter:site": "@xenosite",
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

export default function App() {
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
          <ModelMenu />
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : <Gtag />}
      </body>
    </html>
  );
}
