import { json } from "@remix-run/node";
import { Link, Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import XDot from "~/components/XDot";

import styles from "./styles/app.css";
import { Gtag } from "~/components/Gtag";

// import GlobalLoading from "~/components/GlobalLoading";

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export const meta = ({ params }) => {
  let description = "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  let url = `https://xenosite.org`;

  return [
    { charSet: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: `Xenosite` },
    {
      name: "description",
      content: description,
    },
    {
      name: "robots",
      content: "index, follow",
    },
    {
      tagName: "link",
      rel: "canonical",
      href: "https://xenosite.org",
    },
    {
      name: "author",
      content: "Dr. Josh Swamidass",
    },
    {
      name: "og:title",
      content: `Xenosite`,
    },
    {
      name: "og:type",
      content: "website",
    },
    {
      name: "og:url",
      content: url,
    },
    {
      name: "og:site_name",
      content: "Xenosite",
    },
    {
      name: "og:image",
      content: `/favicon.png`,
    },
    { 
      name: "og:description",
      content: description,
    },
    {
      name: "og:canonical",
      content: "https://xenosite.org",
    },
    {
      name: "twitter:title",
      content: `Xenosite`,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: `/favicon.png`,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@xenosite",
    },
    {
      name: "twitter:creator",
      content: "Dr. Josh Swamidass",
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "url": "https://xenosite.org",
        "logo": "https://xenosite.org/favicon.png"
      }
    },
  ]
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
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : <Gtag />}
      </body>
    </html>
  );
}
