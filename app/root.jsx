import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json
} from "remix";

import React from "react" 
import { cansmi } from '~/rdkit.server'
import _ from "lodash"


export function meta() {
  return {
    charset: "utf-8",
    title: "Xenosite",
    viewport: "width=device-width,initial-scale=1",
  };
}




import styles from "./styles/app.css"

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
