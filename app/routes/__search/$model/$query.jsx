import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ReactDOMServer from 'react-dom/server'
import { resolve_query } from "~/search";
import { ResultSummaryDisplay } from "~/components/ResultSummaryDisplay";

import { MODELS } from "~/data";
import HEADERS from "~/headers";

export function headers() {
  return HEADERS;
}

export function ErrorBoundary(error) {
  console.error(error);
  return (
    <div>
      <div className="mx-auto w-fit text-red-500">
        Ecountered an error: {JSON.stringify(error.error.message)}
      </div>
    </div>
  );
}

function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

function getLdJson(data, modelInfo, name) {

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
        "name": modelInfo.model ? modelInfo.model : "All Models",
        "item": `https://xenosite.org/${data.params.model}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": name !== "" ? name.replace('|', '').trim() : "Query",
        "item": `https://xenosite.org/${data.params.model}/${data.params.query}`
      }
    ]};
    ldJson.push(listItem);
  }

  return ldJson;
}


export async function loader({ params }) {
  const { resolved_query, model } = await resolve_query(params);
  
  return json(
    {
      params,
      resolved_query,
      model,
    },
    { headers: HEADERS }
  );
}

export const meta = ({ data }) => {
  const modelInfo = MODELS.find((x) => x.path == data.model);

  let name = '';
  if (data.resolved_query?.name?.name) {
    name = ` | ${capitalize(data.resolved_query.name.name)}`;
  }

  let model = '';
  if (modelInfo) {
    model = ` | ${modelInfo.model}`;
  }

  let description = "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  if (data.resolved_query?.name?.description && 
    data.params.model !== "_" && 
    name !== null) {
    description = `XenoSite prediction of the reactivity of ${name.replace('|', '').trim()}. The reactivity model is "${data.params.model}".`
  }

  let url = `https://xenosite.org/${data.params.model}/${data.params.query}`
  // const info = modelInfo ? ReactDOMServer.renderToString(modelInfo.info()) : null;
  const ldJson = getLdJson(data, modelInfo, name);

  let results = [
    { charSet: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: `Xenosite${model}${name}` },
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
      content: `Xenosite${model}${name}`,
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
      content: `${url}/0`,
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
      content: `Xenosite${model}${name}`,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: `${url}/0`,
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
};

export default function Model() {
  const { resolved_query, model } = useLoaderData() || {};

  return <ResultSummaryDisplay resolved_query={resolved_query} model={model} />;
}
