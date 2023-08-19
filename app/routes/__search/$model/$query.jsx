import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
// import { V2_MetaFunction } from "@remix-run/node";
// import { Await, defer } from "react";
import { resolve_query } from "~/search";
import { ResultSummaryDisplay } from "~/components/ResultSummaryDisplay";

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

function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

export const meta = ({ data }) => {
  // console.log(data);

  let name = null;
  if (data.resolved_query?.name?.name) {
    name = ` | ${capitalize(data.resolved_query.name.name)}`;
  } else {
    name = '';
  }

  let model = null;
  if (data.model !== '_') {
    model = ` | ${capitalize(data.model)}`;
  } else {
    model = ''; 
  }

  let description = "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes.";
  if (data.resolved_query?.name?.description) {
    if(name && name !== '') {
      description = description + ` ${name.replace('|', '').trim()}:`;
    }
    description = description + " " + data.resolved_query.name.description;
  }

  return [
    { charSet: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: `Xenosite${model}${name}` },
    {
      name: "description",
      content: "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes.",
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
      content: `https://xenosite.org/${data.params.model}/${data.params.query}`,
    },
    {
      name: "og:site_name",
      content: "Xenosite",
    },
    { 
      name: "og:description",
      content: description,
    },
    {
      name: "twitter:title",
      content: `Xenosite${model}${name}`,
    },
    {
      name: "twitter:description",
      content: description,
    },
  ];
};

export default function Model() {
  const { resolved_query, model } = useLoaderData() || {};

  return <ResultSummaryDisplay resolved_query={resolved_query} model={model} />;
}
