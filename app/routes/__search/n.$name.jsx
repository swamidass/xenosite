import { useLoaderData, json } from "remix";
import { resolve_query_as_name } from "~/search";
import { ResultSummaryDisplay } from "~/components/ResultSummaryDisplay";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export async function loader({ params }) {
  const [response, resolved_name] = await resolve_query_as_name(
    params.smiles,
    params.model
  );

  return json(
    {
      params,
      response,
      resolved_name,
    },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } }
  );
}

export default function Model() {
  return <ResultSummaryDisplay />;
}
