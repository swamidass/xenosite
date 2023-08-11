import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
//import { defer } from "@remix-run/node";
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

export default function Model() {
  const { resolved_query, model } = useLoaderData() || {};

  return <ResultSummaryDisplay resolved_query={resolved_query} model={model} />;
}
