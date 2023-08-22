import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { MODELS } from "~/data";
import ReactDOMServer from 'react-dom/server'

import HEADERS from "~/headers";

function getLdJson(modelInfo) {

  let ldJson = [];

  if (modelInfo && modelInfo !== undefined) {
    const listItem = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": 'Xenosite',
        "item": `https://xenosite.org/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": modelInfo.model,
        "item": `https://xenosite.org/${modelInfo.path}`
      }
    ]};
    ldJson.push(listItem);
  }

  return ldJson;
}

export const meta = ({ params }) => {
  const modelInfo = MODELS.find((x) => x.path == params.model);

  let model = '';
  if (modelInfo) {
    model = ` | ${modelInfo.model}`;
  }

  let description = "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  if (params.model !== "_" && 
    modelInfo) {
    description = `XenoSite reactivity model of "${params.model}".`
  }

  let url = `https://xenosite.org/${params.model}`;
  const info = modelInfo ? ReactDOMServer.renderToString(modelInfo.info()) : null;
  const ldJson = getLdJson(modelInfo);

  let results = [
    { charSet: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: `Xenosite${model}` },
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
      content: `Xenosite${model}`,
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
      content: 'https://xenosite.org/xenosite.png',
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
      content: `Xenosite${model}`,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: 'https://xenosite.org/xenosite.png',
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
  ];

  if (ldJson.length > 0) {
    results.push({
      "script:ld+json": ldJson
    });
  }

  return results;
}

export async function loader({ params: { model } }) {
  const modelinfo = MODELS.find((x) => x.path == model);

  if (!modelinfo && model != "_") {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return json({}, { headers: HEADERS });
}

export default function Model() {
  return <Outlet />;
}
