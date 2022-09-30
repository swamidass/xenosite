import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
} from "remix";
import { useLoaderData } from "@remix-run/react";

import _ from "lodash";

import styles from "./styles/app.css";
import gridCss from "react-grid-layout/css/styles.css";
import resizableCss from "react-resizable/css/styles.css";

export async function loader() {
  return json({
    ENV: {
      LIBRIDASS_REST_URL: process.env.LIBRIDASS_REST_URL,
      LIBRIDASS_REST_AUTHORIZATION: process.env.LIBRIDASS_REST_AUTHORIZATION,
    },
  });
}

export function meta() {
  return {
    charset: "utf-8",
    title: "Xenosite",
    viewport: "width=device-width,initial-scale=1",
  };
}

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: gridCss },
    { rel: "stylesheet", href: resizableCss },
  ];
}

export default function App() {
  const data = useLoaderData();
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="max-w-screen-xl mx-auto mt-10">
          <Outlet />
        </div>

        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
