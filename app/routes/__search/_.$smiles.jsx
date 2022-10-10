import { useLoaderData, json } from "remix";
import { resolve_query_as_smiles } from "~/search";
import { ResultSummaryDisplay } from "~/components/ResultSummaryDisplay";

import HEADERS from "~/headers";

export function headers() {
  return HEADERS;
}

export async function loader({ params }) {
  const [response, resolved_name] = await resolve_query_as_smiles(
    params.smiles,
    params.model
  );

  return json(
    {
      params,
      response,
      resolved_name,
    },
    { headers: HEADERS }
  );
}

export default function Model() {
  const { response, resolved_name } = useLoaderData() || {};

  return (
    <ResultSummaryDisplay response={response} resolved_name={resolved_name} />
  );
}
