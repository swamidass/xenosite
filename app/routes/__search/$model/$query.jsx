import { useLoaderData, json } from "remix";
//import { defer } from "@remix-run/node";
import { Await, defer } from "react";
import { resolve_query } from "~/search";
import { ResultSummaryDisplay } from "~/components/ResultSummaryDisplay";

import HEADERS from "~/headers";

export function headers() {
  return HEADERS;
}

export async function loader({ params }) {
  const resolved_query = await resolve_query(params);

  return json(
    {
      params,
      resolved_query,
    },
    { headers: HEADERS }
  );
}

export default function Model() {
  const { resolved_query } = useLoaderData() || {};

  return <ResultSummaryDisplay resolved_query={resolved_query} />;
}
