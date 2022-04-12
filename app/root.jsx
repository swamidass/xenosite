import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json
} from "remix";

import _ from "lodash"

import styles from "./styles/app.css"


export function meta() {
  return {
    charset: "utf-8",
    title: "Xenosite",
    viewport: "width=device-width,initial-scale=1",
  };
}

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

export default function App() {
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
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
